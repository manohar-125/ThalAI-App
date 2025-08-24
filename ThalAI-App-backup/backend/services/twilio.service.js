// services/twilio.service.js
const TWILIO_SID =
  process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH =
  process.env.TWILIO_AUTH || process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WA_FROM = process.env.TWILIO_WA_FROM; // "whatsapp:+14155238886"

export async function sendWa(to, text) {
  if (!TWILIO_SID || !TWILIO_AUTH || !TWILIO_WA_FROM) {
    console.error("❌ Twilio env missing: check TWILIO_SID/TWILIO_AUTH/TWILIO_WA_FROM");
    return;
    // (We don't throw to avoid breaking webhook.)
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const params = new URLSearchParams();
  params.append("To", to);
  params.append("From", TWILIO_WA_FROM);
  params.append("Body", text);

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error("❌ Twilio send error:", err);
  }
}
