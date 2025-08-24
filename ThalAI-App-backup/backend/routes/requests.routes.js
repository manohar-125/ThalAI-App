// routes/requests.routes.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { requester_name, requester_phone, blood_group, units = 1, urgency = "normal", location } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO requests (requester_name, requester_phone, blood_group, units, urgency, location)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [requester_name, requester_phone, blood_group, units, urgency, location]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("create request error:", e.message);
    res.status(500).json({ error: "Failed to create request" });
  }
});

router.get("/", async (req, res) => {
  const { status } = req.query; // open/matched/closed
  try {
    const q = status ? "SELECT * FROM requests WHERE status=$1 ORDER BY created_at DESC"
                     : "SELECT * FROM requests ORDER BY created_at DESC";
    const { rows } = await pool.query(q, status ? [status] : []);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE requests SET status=$1 WHERE id=$2 RETURNING *",
      [status, id]
    );
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to update request" });
  }
});

export default router;
