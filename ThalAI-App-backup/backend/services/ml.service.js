// backend/services/ml.service.js
const axios = require("axios");
const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

async function predictDonor(age, donations_count, last_donation_days, blood_group) {
  try {
    const res = await axios.post(`${ML_URL}/predict`, {
      age, donations_count, last_donation_days, blood_group
    }, { timeout: 5000 });
    return res.data;
  } catch (err) {
    console.error("ML service error:", err.message);
    return { will_donate: -1 };
  }
}
module.exports = { predictDonor };
