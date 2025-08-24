import { useEffect, useState } from "react";
import { api } from "../api";

export default function StatsOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const [users, requests] = await Promise.all([api.users.list(), api.requests.list()]);
      setStats({
        donors: users.length,
        openRequests: requests.filter(r => r.status === "open").length,
        confirmedToday:  // quick metric
          requests.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length
      });
    })();
  }, []);

  if (!stats) return <div className="card">Loading stats…</div>;

  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
      <StatCard label="Total Donors" value={stats.donors} />
      <StatCard label="Open Requests" value={stats.openRequests} />
      <StatCard label="Requests Today" value={stats.confirmedToday} />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ color: "#6b7280", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, marginTop: 6 }}>{value}</div>
    </div>
  );
}
