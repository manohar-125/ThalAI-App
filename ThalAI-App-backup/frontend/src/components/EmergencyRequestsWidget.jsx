import { useEffect, useState } from "react";
import { api } from "../api";

export default function EmergencyRequestsWidget() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.requests.list()
      .then(list => setRequests(list.filter(r => r.status === "open").slice(0, 5)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card">Loading urgent requests…</div>;

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Urgent Requests</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {requests.map(r => (
          <li key={r.id}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <span className="pill pill--red">{r.blood_group}</span>{" "}
              <strong>{r.location}</strong>
              <div style={{ color: "#6b7280", fontSize: 13 }}>#{r.id} • {r.urgency} • {r.units} units</div>
            </div>
            <span className="chev">›</span>
          </li>
        ))}
        {!requests.length && <li>No open requests.</li>}
      </ul>
    </div>
  );
}
