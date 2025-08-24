// backend/routes/donors.routes.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";

// simple distance proxy: exact city = 1 else 0 (upgrade later to geocoding)
function cityMatchScore(donorLoc, reqLoc) {
  if (!donorLoc || !reqLoc) return 0;
  return donorLoc.trim().toLowerCase() === reqLoc.trim().toLowerCase() ? 1 : 0;
}

async function callML(features) {
  const res = await fetch(`${ML_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(features),
  });
  if (!res.ok) return { label: 0, score: 0.0 };
  return await res.json(); // {label, score}
}

router.post("/rank", async (req, res) => {
  try {
    const { blood_group, location = null, limit = 10 } = req.body;

    // 1) fetch eligible donors
    const q = await pool.query(
      `SELECT id, name, email, phone_e164, wa_opt_in, blood_group, location,
              COALESCE( (SELECT MAX(test_date) FROM cbc_tests c WHERE c.user_id=u.id), NOW() - INTERVAL '400 days') AS last_test_date
         FROM users u
        WHERE wa_opt_in = true
          AND phone_e164 IS NOT NULL
          AND blood_group = $1
        ORDER BY id DESC
        LIMIT 200`,
      [blood_group]
    );

    const donors = q.rows;

    // 2) score each donor (heuristics + ML)
    const ranked = [];
    for (const d of donors) {
      // heuristics
      const cityScore = cityMatchScore(d.location, location);      // 0/1
      const daysSince = Math.max(
        0,
        Math.round((Date.now() - new Date(d.last_test_date).getTime()) / (1000 * 3600 * 24))
      );
      const donationGapScore = daysSince >= 90 ? 1 : daysSince / 90; // 0..1 (>=90 days is ideal)

      // ML features (map to your model names)
      const features = {
        frequency_in_days: 30,               // fallback if unknown
        calls_to_donations_ratio: 0.5,
        days_since_last_donation: daysSince,
        donated_earlier: 1,
        blood_group: d.blood_group,
        gender: "unknown"
      };
      let mlScore = 0.0;
      try {
        const ml = await callML(features);
        mlScore = typeof ml.score === "number" ? ml.score : 0.0;
      } catch { mlScore = 0.0; }

      // 3) composite score (tune weights)
      const score =
        0.50 * mlScore +
        0.30 * donationGapScore +
        0.20 * cityScore;

      ranked.push({
        id: d.id,
        name: d.name,
        phone_e164: d.phone_e164,
        blood_group: d.blood_group,
        location: d.location,
        wa_opt_in: d.wa_opt_in,
        days_since_last_donation: daysSince,
        mlScore: Number(mlScore.toFixed(3)),
        score: Number(score.toFixed(3)),
        reason: `ml:${mlScore.toFixed(2)} gap:${donationGapScore.toFixed(2)} city:${cityScore}`
      });
    }

    ranked.sort((a, b) => b.score - a.score);

    res.json(ranked.slice(0, limit));
  } catch (e) {
    console.error("rank error:", e);
    res.status(500).json({ error: "Failed to rank donors" });
  }
});

export default router;
