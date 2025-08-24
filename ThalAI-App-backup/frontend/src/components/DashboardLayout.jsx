export default function DashboardLayout({ title, actions, children, aside }) {
  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr", marginTop: 8 }}>
      <section className="card" style={{ padding: 20 }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>
        </header>
        {children}
      </section>

      {aside && (
        <aside style={{ display: "grid", gap: 16 }}>
          {aside}
        </aside>
      )}
    </div>
  );
}
