// routes/donors.routes.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";

// --- optional fallback: call ML only when ml_score is null ---
async function callMLService(features) {
  const res = await fetch(`${ML_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(features),
  });
  if (!res.ok) throw new Error(`ML service error: ${res.status}`);
  return await res.json(); // { label, score }
}

function safeNumber(n, d = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : d;
}

// score = 0.6*ml + 0.3*sameCity + 0.1*recency
function compositeScore(row) {
  const ml = safeNumber(row.ml_score, 0);
  const sameCity = row.same_city ? 1 : 0;
  const d = row.days_since_last_donation;
  // recency in [0..1]: 1 at 0 days, ~0 after >=180 days (cap)
  const recency =
    d == null
      ? 0
      : Math.max(0, Math.min(1, 1 - safeNumber(d, 180) / 180));

  return Number((0.6 * ml + 0.3 * sameCity + 0.1 * recency).toFixed(2));
}

/**
 * POST /api/donors/rank
 * body: { blood_group?: string, location?: string, limit?: number }
 * Returns: [{ id, name, phone_e164, blood_group, location, wa_opt_in, score }]
 */
router.post("/rank", async (req, res) => {
  const blood_group = (req.body?.blood_group || null);
  const locationRaw = (req.body?.location || null);
  const limit = Math.max(1, Number(req.body?.limit) || 5);

  // ILIKE pattern for location, if provided
  const locPattern = locationRaw ? `%${locationRaw}%` : null;

  try {
    // First pass: respect location if provided
    const { rows } = await pool.query(
      `
      SELECT
        id, name, phone_e164, blood_group, location, wa_opt_in,
        COALESCE(ml_score, 0.0) AS ml_score,
        days_since_last_donation,
        CASE WHEN $2 IS NOT NULL AND location ILIKE $2 THEN 1 ELSE 0 END AS same_city
      FROM users
      WHERE wa_opt_in = TRUE
        AND phone_e164 IS NOT NULL
        AND ($1 IS NULL OR blood_group = $1)
        AND ($2 IS NULL OR location ILIKE $2)
      ORDER BY
        COALESCE(ml_score, 0.0) DESC NULLS LAST,
        created_at DESC
      LIMIT $3
      `,
      [blood_group, locPattern, limit * 3] // pull a few extra to compute final score & sort
    );

    // If nothing matched and a location was specified, retry without location constraint
    let candidates = rows;
    if (!candidates.length && locPattern) {
      const retry = await pool.query(
        `
        SELECT
          id, name, phone_e164, blood_group, location, wa_opt_in,
          COALESCE(ml_score, 0.0) AS ml_score,
          days_since_last_donation,
          0 AS same_city
        FROM users
        WHERE wa_opt_in = TRUE
          AND phone_e164 IS NOT NULL
          AND ($1 IS NULL OR blood_group = $1)
        ORDER BY COALESCE(ml_score, 0.0) DESC NULLS LAST, created_at DESC
        LIMIT $2
        `,
        [blood_group, limit * 3]
      );
      candidates = retry.rows;
    }

    // Opportunistic ML fallback for rows with missing ml_score (rare after import)
    // This runs in parallel but we swallow errors to keep ranking responsive.
    const enriched = await Promise.all(
      candidates.map(async (r) => {
        let mlScore = safeNumber(r.ml_score, 0);
        if (!mlScore) {
          try {
            const features = {
              // Use whatever feature columns you imported onto users
              frequency_in_days: r.frequency_in_days ?? null,
              calls_to_donations_ratio: r.calls_to_donations_ratio ?? null,
              days_since_last_donation: r.days_since_last_donation ?? null,
              donated_earlier: r.donated_earlier ? 1 : 0,
              blood_group: r.blood_group ?? null,
              gender: r.gender ?? null,
            };
            const ml = await callMLService(features);
            if (typeof ml?.score === "number") mlScore = ml.score;
          } catch (_) {
            // ignore ML errors in fallback path
          }
        }
        // compute same_city again here if needed
        const same_city =
          locationRaw && r.location
            ? new RegExp(locationRaw, "i").test(r.location)
            : Boolean(r.same_city);

        const score = compositeScore({
          ml_score: mlScore,
          same_city,
          days_since_last_donation: r.days_since_last_donation,
        });

        return {
          id: r.id,
          name: r.name,
          phone_e164: r.phone_e164,
          blood_group: r.blood_group,
          location: r.location,
          wa_opt_in: r.wa_opt_in,
          score,
        };
      })
    );

    // Final sort by composite score (desc) and trim to limit
    enriched.sort((a, b) => b.score - a.score);
    res.json(enriched.slice(0, limit));
  } catch (e) {
    console.error("rank donors error:", e.message);
    res.status(500).json({ error: "Failed to rank donors" });
  }
});

export default router;
