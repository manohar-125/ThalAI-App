// routes/healthRecords.routes.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM health_records ORDER BY id ASC");
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch health records" });
  }
});

router.post("/", async (req, res) => {
  const { user_id, condition, notes } = req.body;
  try {
    const { rows } = await pool.query(
      "INSERT INTO health_records (user_id, condition, notes) VALUES ($1,$2,$3) RETURNING *",
      [user_id, condition, notes]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to insert health record" });
  }
});

export default router;
