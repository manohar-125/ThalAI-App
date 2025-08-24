// bot/whatsapp.webhook.js
import express from "express";
import pool from "../db.js";
import { sendWa } from "../services/twilio.service.js";

const router = express.Router();

const HELP_TEXT =
  `Hi! I'm the ThalAI bot. Try:
• donate         (opt-in for alerts)
• BG B+          (set blood group)
• LOC Pune       (set location)
• request B+ Pune 2 urgent
Reply 1=Yes, 2=No when you get an alert.
Type help to see this again.`;

// Small utils
const normPhone = waFrom => (waFrom || "").replace(/^whatsapp:/, "");
const synthEmail = phone => `${phone.replace(/\+/g, "plus")}@wa.local`;
const synthName = phone => `WA ${phone.slice(-4)}`;
function parseRequest(body) {
  // request B+ Pune 2 urgent
  const parts = body.trim().split(/\s+/);
  const [, bg = "B+", loc = "Unknown", unitsStr = "1", urg = "normal"] = parts;
  return {
    blood_group: bg.toUpperCase(),
    location: loc,
    units: Math.max(1, parseInt(unitsStr, 10) || 1),
    urgency: (urg || "normal").toLowerCase(),
  };
}

async function ensureUserFromPhone(phone) {
  // Upsert by unique phone_e164; satisfy NOT NULL name/email
  const q = await pool.query(
    `INSERT INTO users (name, email, phone_e164, wa_opt_in, preferred_channel)
     VALUES ($1,$2,$3,true,'whatsapp')
     ON CONFLICT (phone_e164) DO UPDATE
       SET wa_opt_in = true,
           preferred_channel = 'whatsapp'
     RETURNING *`,
    [synthName(phone), synthEmail(phone), phone]
  );
  return q.rows[0];
}

router.post("/", express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const fromWa = req.body.From; // e.g., "whatsapp:+91..."
    const phone = normPhone(fromWa);
    const raw = (req.body.Body || "").trim();

    console.log("📩 WA inbound:", { fromWa, phone, raw });

    if (!raw) {
      await sendWa(fromWa, HELP_TEXT);
      return res.status(200).end();
    }

    // Create/ensure the user record first (fixes NOT NULL issue)
    const user = await ensureUserFromPhone(phone);

    // Split multi-line messages into separate commands
    const commands = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

    for (const cmd of commands) {
      const lower = cmd.toLowerCase();

      // help
      if (["help", "menu"].includes(lower)) {
        await sendWa(fromWa, HELP_TEXT);
        continue;
      }

      // donate (opt-in)
      if (lower.includes("donate")) {
        await pool.query("UPDATE users SET wa_opt_in=true WHERE phone_e164=$1", [phone]);
        await sendWa(fromWa, "You're opted in ✅\nNow send:\n• BG B+\n• LOC Pune");
        continue;
      }

      // set BG
      if (lower.startsWith("bg ")) {
        const bg = cmd.split(/\s+/)[1]?.toUpperCase() || "B+";
        await pool.query("UPDATE users SET blood_group=$1 WHERE phone_e164=$2", [bg, phone]);
        await sendWa(fromWa, `Blood group set to ${bg} ✅`);
        continue;
      }

      // set LOC
      if (lower.startsWith("loc ")) {
        const loc = cmd.slice(4).trim();
        await pool.query("UPDATE users SET location=$1 WHERE phone_e164=$2", [loc, phone]);
        await sendWa(fromWa, `Location set to ${loc} ✅`);
        continue;
      }

      // status
      if (lower === "status") {
        const { rows } = await pool.query(
          `SELECT id, blood_group, units, urgency, location, status, created_at
           FROM requests
           WHERE requester_phone=$1
           ORDER BY id DESC LIMIT 5`,
          [phone]
        );
        if (!rows.length) await sendWa(fromWa, "No recent requests found.");
        else {
          const lines = rows.map(
            r => `#${r.id} • ${r.blood_group} • ${r.units}u • ${r.urgency} • ${r.location} • ${r.status}`
          );
          await sendWa(fromWa, "Recent requests:\n" + lines.join("\n"));
        }
        continue;
      }

      // donor reply YES
      if (["1", "yes", "y"].includes(lower)) {
        const { rows: openB } = await pool.query(
          `SELECT b.* FROM bridges b
           JOIN users u ON u.id=b.donor_user_id
           WHERE u.phone_e164=$1 AND b.status='pending'
           ORDER BY b.id DESC LIMIT 1`,
          [phone]
        );
        if (openB.length) {
          await pool.query(
            `UPDATE bridges SET status='confirmed', confirmed_at=NOW() WHERE id=$1`,
            [openB[0].id]
          );
          await sendWa(fromWa, "🙏 Thank you for confirming! Our coordinator will reach out.");
        } else {
          await sendWa(fromWa, "Thanks! No pending requests for you right now.");
        }
        continue;
      }

      // donor reply NO
      if (["2", "no", "n"].includes(lower)) {
        await pool.query(
          `UPDATE bridges SET status='declined'
           WHERE id IN (
             SELECT b.id FROM bridges b
             JOIN users u ON u.id=b.donor_user_id
             WHERE u.phone_e164=$1 AND b.status='pending'
             ORDER BY b.id DESC LIMIT 1
           )`,
          [phone]
        );
        await sendWa(fromWa, "No worries—thanks for responding!");
        continue;
      }

      // blood request
      if (lower.startsWith("request")) {
        const { blood_group, location, units, urgency } = parseRequest(cmd);
        if (!/^(A|B|AB|O)[+-]$/i.test(blood_group)) {
          await sendWa(fromWa, "Please specify a valid blood group (e.g., A+, O-, B+, AB+).");
          continue;
        }

        const rq = await pool.query(
          `INSERT INTO requests (requester_name, requester_phone, blood_group, units, urgency, location)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
          [user?.name || synthName(phone), phone, blood_group, units, urgency, location]
        );

        await sendWa(
          fromWa,
          `📝 Request created (ID ${rq.rows[0].id}):\n${blood_group} at ${location}, ${units} units (${urgency}).\nFinding donors...`
        );

        // Call internal ranking API via localhost, not ngrok
        const base = process.env.SELF_BASE_URL || "http://localhost:3000";
        let top = [];
        try {
          const resp = await fetch(`${base}/api/donors/rank`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blood_group, limit: 5 }),
          });

          if (!resp.ok) {
            const txt = await resp.text();
            console.error("❌ rank donors HTTP error", resp.status, txt);
            await sendWa(fromWa, "We had trouble ranking donors right now. Please try again shortly.");
            continue;
          }

          const ct = resp.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            top = await resp.json();
          } else {
            const txt = await resp.text();
            console.error("❌ rank donors non-JSON response:", txt);
            await sendWa(fromWa, "We had trouble ranking donors right now. Please try again shortly.");
            continue;
          }
        } catch (err) {
          console.error("❌ rank donors fetch failed:", err.message);
          await sendWa(fromWa, "We had trouble reaching the ranking service. Please try again.");
          continue;
        }

        for (const d of top) {
          try {
            await pool.query(
              `INSERT INTO bridges (request_id, donor_user_id, status, contacted_at)
               VALUES ($1,$2,'pending',NOW())`,
              [rq.rows[0].id, d.id]
            );
            await sendWa(
              `whatsapp:${d.phone_e164}`,
              `🚨 Emergency: ${blood_group} blood needed at ${location}.\nCan you donate today?\nReply "1" for Yes or "2" for No.`
            );
          } catch (e) {
            console.error("bridge/notify error for donor", d.id, e.message);
          }
        }

        await sendWa(fromWa, `📣 Contacted ${top.length} donors. You'll be notified on confirmations.`);
        continue;
      }

      // fallback for an unrecognized line
      await sendWa(fromWa, HELP_TEXT);
    }

    return res.status(200).end();
  } catch (e) {
    console.error("WA webhook fatal error:", e);
    return res.status(200).end(); // Always 200 to avoid Twilio retry storms
  }
});

export default router;
