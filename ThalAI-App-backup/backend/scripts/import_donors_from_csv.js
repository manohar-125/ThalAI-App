// backend/scripts/import_donors_from_csv.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse";
import pool from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = process.argv[2] || path.join(__dirname, "../../ml-service/data/Hackathon Data.csv");
const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";

function normStr(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" || s.toLowerCase() === "nan" ? null : s;
}
function toNum(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function asBool01(v) {
  const s = normStr(v);
  if (s == null) return null;
  const t = s.toLowerCase();
  if (["1","true","yes","y"].includes(t)) return 1;
  if (["0","false","no","n"].includes(t)) return 0;
  return null;
}
function daysSince(dateStr) {
  const s = normStr(dateStr);
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d)) return null;
  const today = new Date();
  const diffMs = today - d;
  return Math.floor(diffMs / (1000*60*60*24));
}

async function mlScore(feat) {
  try {
    const res = await fetch(`${ML_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(feat)
    });
    if (!res.ok) throw new Error(`ML ${res.status}`);
    const j = await res.json(); // {label, score}
    return (typeof j.score === "number" ? j.score : null);
  } catch (e) {
    console.error("⚠️  ML error:", e.message);
    return null;
  }
}

async function upsertUser(u) {
  // Prefer phone or email as a stable unique key
  const phone = normStr(u.phone) || normStr(u.phone_e164);
  const email = normStr(u.email) || null;
  const name  = normStr(u.name) || null;

  const blood_group = normStr(u.blood_group) || null;
  const gender = normStr(u.gender) || null;
  const location = normStr(u.location) || null;

  const frequency_in_days = toNum(u.frequency_in_days);
  const calls_to_donations_ratio = toNum(u.calls_to_donations_ratio);
  const donated_earlier = (asBool01(u.donated_earlier) === 1);
  const d1 = daysSince(u.last_bridge_donation_date);
  const d2 = daysSince(u.last_transfusion_date);
  const days_since_last_donation = (d1 ?? d2 ?? null);

  const features = {
    frequency_in_days,
    calls_to_donations_ratio,
    days_since_last_donation,
    donated_earlier: donated_earlier ? 1 : 0,
    blood_group,
    gender
  };
  const score = await mlScore(features);

  // Upsert by phone if available; else by email; else create a synthetic email
  const keyEmail = email || (phone ? null : `csv_${Math.random().toString(36).slice(2)}@demo.local`);

  // 1) find existing
  let existing = null;
  if (phone) {
    const q = await pool.query(`SELECT * FROM users WHERE phone_e164=$1`, [phone]);
    existing = q.rows[0] || null;
  }
  if (!existing && keyEmail) {
    const q = await pool.query(`SELECT * FROM users WHERE email=$1`, [keyEmail]);
    existing = q.rows[0] || null;
  }

  if (existing) {
    const q = await pool.query(
      `UPDATE users SET
         name = COALESCE($1,name),
         email = COALESCE($2,email),
         phone_e164 = COALESCE($3, phone_e164),
         blood_group = COALESCE($4, blood_group),
         gender = COALESCE($5, gender),
         location = COALESCE($6, location),
         wa_opt_in = COALESCE($7, wa_opt_in),
         frequency_in_days = COALESCE($8, frequency_in_days),
         calls_to_donations_ratio = COALESCE($9, calls_to_donations_ratio),
         days_since_last_donation = COALESCE($10, days_since_last_donation),
         donated_earlier = COALESCE($11, donated_earlier),
         ml_score = COALESCE($12, ml_score)
       WHERE id=$13
       RETURNING id`,
      [
        name, keyEmail, phone, blood_group, gender, location, true,
        frequency_in_days, calls_to_donations_ratio, days_since_last_donation,
        donated_earlier, score, existing.id
      ]
    );
    return q.rows[0].id;
  } else {
    const q = await pool.query(
      `INSERT INTO users
        (name, email, phone_e164, wa_opt_in, blood_group, gender, location,
         frequency_in_days, calls_to_donations_ratio, days_since_last_donation,
         donated_earlier, ml_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        name, keyEmail, phone, true, blood_group, gender, location,
        frequency_in_days, calls_to_donations_ratio, days_since_last_donation,
        donated_earlier, score
      ]
    );
    return q.rows[0].id;
  }
}

async function main() {
  console.log("📥 Importing:", CSV_PATH);
  const parser = fs.createReadStream(CSV_PATH).pipe(parse({ columns: true, skip_empty_lines: true }));

  let count = 0, ok = 0, bad = 0;
  for await (const row of parser) {
    count++;
    try {
      await upsertUser(row);
      ok++;
      if (ok % 50 === 0) console.log(`… ${ok} upserts`);
    } catch (e) {
      bad++;
      console.error(`Row ${count} failed:`, e.message);
    }
  }
  console.log(`✅ Done. processed=${count} ok=${ok} failed=${bad}`);
  await pool.end();
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
