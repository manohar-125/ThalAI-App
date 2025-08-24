// routes/predictions.routes.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM predictions ORDER BY id ASC");
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch predictions" });
  }
});

router.post("/", async (req, res) => {
  const { user_id, prediction_result, confidence_score = null, test_id = null } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO predictions (user_id, test_id, prediction_result, confidence_score)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [user_id, test_id, prediction_result, confidence_score]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to insert prediction" });
  }
});

export default router;
