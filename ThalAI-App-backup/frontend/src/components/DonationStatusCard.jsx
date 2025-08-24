import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

/**
 * Simple heuristic:
 * - If last confirmed donation < 14 days ago → Not eligible
 * - Otherwise → Eligible
 * (Replace with your real rule or ML when ready.)
 */
export default function DonationStatusCard() {
  const [bridges, setBridges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.bridges.list().then(setBridges).finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const last = bridges
      .filter(b => b.status === "confirmed")
      .map(b => b.confirmed_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];

    if (!last) return { eligible: true, nextEligibleDate: "Anytime", daysRemaining: 0 };

    const lastDate = new Date(last);
    const minGapDays = 14; // change to 56 if you want a stricter policy
    const next = new Date(lastDate);
    next.setDate(next.getDate() + minGapDays);

    const today = new Date();
    const daysRemain = Math.max(0, Math.ceil((next - today) / (1000 * 60 * 60 * 24)));
    return { eligible: daysRemain === 0, nextEligibleDate: next.toDateString(), daysRemaining: daysRemain };
  }, [bridges]);

  if (loading) return <div className="card">Checking eligibility…</div>;

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Donation Eligibility</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className={`dot ${summary.eligible ? "dot--ok" : "dot--warn"}`}></span>
        <strong>{summary.eligible ? "Eligible" : "Not eligible right now"}</strong>
      </div>
      <p style={{ margin: 0 }}>Next eligible date: <strong>{summary.nextEligibleDate}</strong></p>
      <p style={{ marginTop: 6, color: "#6b7280", fontSize: 14 }}>Days remaining: {summary.daysRemaining}</p>
    </div>
  );
}
