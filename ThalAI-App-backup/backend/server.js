// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import pool from "./db.js";

// routes
import usersRoutes from "./routes/users.routes.js";
import healthRoutes from "./routes/healthRecords.routes.js";
import cbcRoutes from "./routes/cbcTests.routes.js";
import predRoutes from "./routes/predictions.routes.js";
import reqRoutes from "./routes/requests.routes.js";
import bridgesRoutes from "./routes/bridges.routes.js";
import msgRoutes from "./routes/messages.routes.js";
import donorsRoutes from "./routes/donors.routes.js";

// bot webhook
import waWebhook from "./bot/whatsapp.webhook.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";
async function callMLService(features) {
  const res = await fetch(`${ML_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(features),
  });
  if (!res.ok) throw new Error(`ML service error: ${res.status}`);
  return await res.json();
}

// health check
app.get("/", (_req, res) => {
  res.json({ message: "🚀 ThalAI backend running", ml_url: ML_URL });
});

// mount APIs
app.use("/api/users", usersRoutes);
app.use("/api/health-records", healthRoutes);
app.use("/api/cbc-tests", cbcRoutes);
app.use("/api/predictions", predRoutes);
app.use("/api/requests", reqRoutes);
app.use("/api/bridges", bridgesRoutes);
app.use("/api/messages", msgRoutes);
app.use("/api/donors", donorsRoutes);

// WhatsApp webhook
app.use("/bot/whatsapp", waWebhook);

// start
app.listen(port, () => {
  console.log(`✅ ThalAI-App backend running at http://localhost:${port}`);
});
