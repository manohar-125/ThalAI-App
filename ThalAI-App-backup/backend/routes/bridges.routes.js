// routes/bridges.routes.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { request_id, donor_user_id, status = "pending", notes = null } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO bridges (request_id, donor_user_id, status, contacted_at, notes)
       VALUES ($1,$2,$3,NOW(),$4) RETURNING *`,
      [request_id, donor_user_id, status, notes]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Failed to create bridge" });
  }
});

router.get("/", async (req, res) => {
  const { request_id } = req.query;
  try {
    const q = request_id
      ? `SELECT * FROM bridges WHERE request_id=$1 ORDER BY id DESC`
      : `SELECT * FROM bridges ORDER BY id DESC`;
    const { rows } = await pool.query(q, request_id ? [request_id] : []);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch bridges" });
  }
});

router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // confirmed/declined/completed
  const setConfirmed = status === "confirmed" ? ", confirmed_at=NOW()" : "";
  try {
    const { rows } = await pool.query(
      `UPDATE bridges SET status=$1 ${setConfirmed} WHERE id=$2 RETURNING *`,
      [status, id]
    );
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to update bridge" });
  }
});

export default router;
