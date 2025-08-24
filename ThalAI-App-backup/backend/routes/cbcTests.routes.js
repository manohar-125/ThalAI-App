// routes/cbcTests.routes.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM cbc_tests ORDER BY id ASC");
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch CBC tests" });
  }
});

router.post("/", async (req, res) => {
  const {
    user_id, hemoglobin, rbc_count, wbc_count, platelet_count,
    mcv = null, mch = null, mchc = null
  } = req.body;

  // Optional Mentzer (if column exists)
  let mentzer = null;
  if (mcv != null && rbc_count != null && Number(rbc_count) > 0) {
    mentzer = Number(mcv) / Number(rbc_count);
  }

  try {
    // if you added mentzer_index column:
    const { rows } = await pool.query(
      `INSERT INTO cbc_tests (user_id, hemoglobin, rbc_count, wbc_count, platelet_count, mcv, mch, mchc)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [user_id, hemoglobin, rbc_count, wbc_count, platelet_count, mcv, mch, mchc]
    );
    res.status(201).json({ ...rows[0], mentzer_index: mentzer });
  } catch (e) {
    console.error("CBC insert error:", e.message);
    res.status(500).json({ error: "Failed to insert CBC test" });
  }
});

export default router;
