import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ by: "name", dir: "asc" });

  useEffect(() => {
    api.users.list().then(setUsers);
  }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    const list = users.filter(u =>
      (u.name || "").toLowerCase().includes(s) ||
      (u.email || "").toLowerCase().includes(s) ||
      (u.blood_group || "").toLowerCase().includes(s) ||
      (u.location || "").toLowerCase().includes(s)
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => (String(a[sort.by] || "").localeCompare(String(b[sort.by] || ""))) * dir);
  }, [users, q, sort]);

  function setSortBy(by) {
    setSort(prev => ({ by, dir: prev.by === by && prev.dir === "asc" ? "desc" : "asc" }));
  }

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h3 style={{ margin: 0 }}>Users</h3>
        <input className="input" style={{ maxWidth: 260 }} placeholder="Search name/email/bg/location"
               value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
              <Th onClick={() => setSortBy("name")} label="Name" sort={sort} id="name" />
              <Th onClick={() => setSortBy("email")} label="Email" sort={sort} id="email" />
              <Th onClick={() => setSortBy("blood_group")} label="Blood Group" sort={sort} id="blood_group" />
              <Th onClick={() => setSortBy("location")} label="Location" sort={sort} id="location" />
              <th style={{ padding: "10px 6px" }}>Opt-in</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 6px" }}>{u.name || "—"}</td>
                <td style={{ padding: "10px 6px" }}>{u.email || "—"}</td>
                <td style={{ padding: "10px 6px" }}>
                  <span className="pill">{u.blood_group || "—"}</span>
                </td>
                <td style={{ padding: "10px 6px" }}>{u.location || "—"}</td>
                <td style={{ padding: "10px 6px" }}>{u.wa_opt_in ? "Yes" : "No"}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan="5" style={{ padding: 12, color: "#6b7280" }}>No users match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ label, sort, id, onClick }) {
  const active = sort.by === id;
  return (
    <th onClick={onClick} style={{ padding: "10px 6px", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
      {label} {active ? (sort.dir === "asc" ? "▲" : "▼") : ""}
    </th>
  );
}
