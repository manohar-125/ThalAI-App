// routes/messages.routes.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { user_id = null, channel, direction, text, intent = null, payload = null } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO messages (user_id, channel, direction, text, intent, payload)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [user_id, channel, direction, text, intent, payload]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to log message" });
  }
});

router.get("/", async (req, res) => {
  const { user_id } = req.query;
  try {
    const q = user_id
      ? "SELECT * FROM messages WHERE user_id=$1 ORDER BY ts DESC"
      : "SELECT * FROM messages ORDER BY ts DESC";
    const { rows } = await pool.query(q, user_id ? [user_id] : []);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default router;
