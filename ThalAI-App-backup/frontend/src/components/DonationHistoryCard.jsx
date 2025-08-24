import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

export default function DonationHistoryCard() {
  const [bridges, setBridges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.bridges.list().then(setBridges).finally(() => setLoading(false));
  }, []);

  const { totalConfirmed, lastConfirmedDate } = useMemo(() => {
    const confirmed = bridges.filter(b => b.status === "confirmed");
    const last = confirmed
      .map(b => b.confirmed_at || b.contacted_at || b.created_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];
    return { totalConfirmed: confirmed.length, lastConfirmedDate: last ? new Date(last).toDateString() : "—" };
  }, [bridges]);

  if (loading) return <div className="card">Loading donation history…</div>;

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Donation History</h3>
        <span className="pill">{totalConfirmed} total</span>
      </div>
      <p style={{ margin: 0 }}>Last confirmed donation: <strong>{lastConfirmedDate}</strong></p>
      <p style={{ marginTop: 6, color: "#6b7280", fontSize: 14 }}>
        Confirmations are recorded when a donor replies “1 / Yes”.
      </p>
    </div>
  );
}
