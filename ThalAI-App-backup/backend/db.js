// db.js
import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL database"))
  .catch(err => console.error("❌ Database connection error:", err));

export default pool;
