import { useMemo, useRef, useState } from "react";
import {
  Heart, Shield, Users, AlertTriangle, Phone, MapPin,
  Droplets, Activity, Clock, CheckCircle
} from "lucide-react";

export default function ThalAIDashboard() {
  // form states
  const [bg, setBg] = useState("B+");
  const [loc, setLoc] = useState("Hyderabad");
  const [units, setUnits] = useState(2);
  const [urgency, setUrgency] = useState("urgent");
  const [requesterName, setRequesterName] = useState("Dr. Sarah");
  const [requesterPhone, setRequesterPhone] = useState("+919876543210");

  // mock data
  const [requests, setRequests] = useState([
    { id: 1, blood_group: "O-", units: 3, urgency: "critical", location: "AIIMS Delhi", status: "open", created_at: "2025-01-24T10:30:00Z", requester_name: "Dr. Kumar" },
    { id: 2, blood_group: "AB+", units: 2, urgency: "urgent", location: "Apollo Hyderabad", status: "open", created_at: "2025-01-24T11:45:00Z", requester_name: "Dr. Patel" },
    { id: 3, blood_group: "A+", units: 1, urgency: "normal", location: "Max Hospital", status: "fulfilled", created_at: "2025-01-24T09:15:00Z", requester_name: "Dr. Singh" }
  ]);

  const [bridges] = useState([
    { id: 1, request_id: 1, donor_user_id: 101, status: "confirmed" },
    { id: 2, request_id: 1, donor_user_id: 102, status: "pending" },
    { id: 3, request_id: 2, donor_user_id: 103, status: "confirmed" },
    { id: 4, request_id: 2, donor_user_id: 104, status: "declined" }
  ]);

  const [rank, setRank] = useState([]);
  const [messages] = useState([
    { id: 1, channel: "whatsapp", to_phone: "+919876543210", direction: "outbound", status: "delivered" },
    { id: 2, channel: "whatsapp", to_phone: "+919876543211", direction: "inbound", status: "received" },
    { id: 3, channel: "sms", to_phone: "+919876543212", direction: "outbound", status: "sent" }
  ]);

  const [stats, setStats] = useState({
    totalDonors: 1247,
    openRequests: 2,
    confirmations: 2,
    responseRate: 75,
    livesImpacted: 3891,
    activeWarriors: 892
  });

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [auto, setAuto] = useState(true);
  const timerRef = useRef(null);

  async function createRequest() {
    setErr(""); setOk("");
    try {
      const newRequest = {
        id: requests.length + 1,
        requester_name: requesterName,
        requester_phone: requesterPhone,
        blood_group: bg,
        units: Number(units) || 1,
        urgency,
        location: loc,
        status: "open",
        created_at: new Date().toISOString()
      };
      setRequests(prev => [...prev, newRequest]);
      setOk("🩸 Blood request dispatched to warriors!");
      setStats(prev => ({ ...prev, openRequests: prev.openRequests + 1 }));
    } catch (e) { setErr(e.message || "Failed to create request"); }
  }

  async function doRank() {
    setErr(""); setOk("");
    try {
      const mockDonors = [
        { id: 201, name: "Arjun Reddy", phone_e164: "+919876543220", location: "Hyderabad", score: 95, blood_group: bg },
        { id: 202, name: "Priya Sharma", phone_e164: "+919876543221", location: "Hyderabad", score: 88, blood_group: bg },
        { id: 203, name: "Vikram Singh", phone_e164: "+919876543222", location: "Hyderabad", score: 82, blood_group: bg },
        { id: 204, name: "Ananya Gupta", phone_e164: "+919876543223", location: "Hyderabad", score: 79, blood_group: bg },
        { id: 205, name: "Rohit Kumar", phone_e164: "+919876543224", location: "Hyderabad", score: 75, blood_group: bg }
      ];
      setRank(mockDonors);
      setOk("⚡ Blood Warriors ranked by proximity & availability!");
    } catch (e) { setErr(e.message || "Ranking failed"); }
  }

  async function notifyTopN() {
    setErr(""); setOk("");
    try {
      if (!rank.length) await doRank();
      setOk("📱 Emergency alert sent to " + rank.length + " Blood Warriors!");
    } catch (e) { setErr(e.message || "Notify failed"); }
  }

  const openRequests = useMemo(
    () => requests
      .filter((r) => r.status === "open")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [requests]
  );

  const getUrgencyPill = (urgency) => {
    switch (urgency) {
      case "critical": return "bg-red-500/90 text-white";
      case "urgent": return "bg-amber-500/90 text-white";
      default: return "bg-yellow-500/90 text-white";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "text-emerald-400";
      case "pending": return "text-amber-400";
      case "declined": return "text-rose-400";
      default: return "text-slate-300";
    }
  };

  return (
    <div
      className="min-h-screen relative text-slate-100"
      style={{
        backgroundImage:
          "linear-gradient(rgba(10,15,25,0.85), rgba(10,15,25,0.85)), url('https://images.unsplash.com/photo-1580281657521-4b63c7e7b65d?q=80&w=1920&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* soft blur film on top (extra frost) */}
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      <div className="relative z-10 p-6 md:p-10">
        {/* HEADER */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-white/10 border border-white/20 p-2 rounded-xl shadow-lg backdrop-blur-md">
              <div className="w-16 h-16 bg-rose-500/90 rounded-lg flex items-center justify-center shadow-inner">
                <Droplets className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Thal <span className="text-rose-400">AI</span> Dashboard
              </h1>
              <p className="text-slate-300 font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Blood Warriors Command Center
              </p>
            </div>
          </div>
          <p className="text-slate-400 ml-20 max-w-2xl">
            Connecting heroes, saving lives — AI-powered blood donation network.
          </p>
        </header>

        {/* STATS – glass cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Lives Impacted", value: stats.livesImpacted, Icon: Heart },
            { label: "Blood Warriors", value: stats.totalDonors, Icon: Users },
            { label: "Active Warriors", value: stats.activeWarriors, Icon: Shield },
            { label: "Open Requests", value: stats.openRequests, Icon: AlertTriangle },
            { label: "Confirmations", value: stats.confirmations, Icon: CheckCircle },
            { label: "Response Rate", value: `${stats.responseRate}%`, Icon: Activity }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/10 border border-white/20 p-4 rounded-2xl shadow-xl backdrop-blur-md hover:bg-white/15 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300">{item.label}</p>
                  <p className="text-2xl font-bold text-slate-50">{item.value}</p>
                </div>
                <item.Icon className="w-8 h-8 text-slate-200" />
              </div>
            </div>
          ))}
        </section>

        {/* EMERGENCY FORM – glass panel */}
        <section className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-2xl mb-8 backdrop-blur-lg">
          <div className="flex items-center gap-2 mb-6">
            <Droplets className="w-6 h-6 text-rose-300" />
            <h2 className="text-2xl font-bold">Emergency Blood Request</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200">Blood Group</label>
              <select
                className="w-full border border-white/25 bg-white/10 text-slate-100 placeholder-slate-300 focus:border-rose-300 p-2 rounded-lg backdrop-blur-md"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
              >
                {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(opt => (
                  <option key={opt} value={opt} className="text-slate-900">{opt}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200">Location</label>
              <input
                className="w-full border border-white/25 bg-white/10 text-slate-100 placeholder-slate-300 focus:border-rose-300 p-2 rounded-lg backdrop-blur-md"
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                placeholder="Hospital/City"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200">Units</label>
              <input
                className="w-full border border-white/25 bg-white/10 text-slate-100 placeholder-slate-300 focus:border-rose-300 p-2 rounded-lg backdrop-blur-md"
                type="number"
                min="1"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200">Urgency</label>
              <select
                className="w-full border border-white/25 bg-white/10 text-slate-100 focus:border-rose-300 p-2 rounded-lg backdrop-blur-md"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              >
                <option className="text-slate-900" value="normal">Normal</option>
                <option className="text-slate-900" value="urgent">Urgent</option>
                <option className="text-slate-900" value="critical">Critical</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200">Requester</label>
              <input
                className="w-full border border-white/25 bg-white/10 text-slate-100 placeholder-slate-300 focus:border-rose-300 p-2 rounded-lg backdrop-blur-md"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Doctor Name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200">Phone</label>
              <input
                className="w-full border border-white/25 bg-white/10 text-slate-100 placeholder-slate-300 focus:border-rose-300 p-2 rounded-lg backdrop-blur-md"
                value={requesterPhone}
                onChange={(e) => setRequesterPhone(e.target.value)}
                placeholder="+91XXXXXXXXXX"
              />
            </div>
          </div>

          {/* ACTION BUTTONS – visible + elevated */}
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={createRequest}
              className="bg-slate-100/90 hover:bg-white text-slate-900 border border-white/40 shadow-lg px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors backdrop-blur-md"
            >
              <Droplets className="w-4 h-4" />
              Create Request
            </button>
            <button
              onClick={doRank}
              className="bg-slate-100/90 hover:bg-white text-slate-900 border border-white/40 shadow-lg px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors backdrop-blur-md"
            >
              <Shield className="w-4 h-4" />
              Rank Warriors
            </button>
            <button
              onClick={notifyTopN}
              className="bg-slate-100/90 hover:bg-white text-slate-900 border border-white/40 shadow-lg px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors backdrop-blur-md"
            >
              <Phone className="w-4 h-4" />
              Alert Warriors
            </button>

            <label className="flex items-center gap-2 ml-auto">
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
                className="w-4 h-4 text-rose-500 rounded focus:ring-rose-400"
              />
              <span className="text-sm font-medium text-slate-200">Auto-refresh</span>
            </label>
          </div>

          {ok && (
            <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-4 py-3 rounded-lg mb-4 backdrop-blur-md">
              {ok}
            </div>
          )}
          {err && (
            <div className="bg-rose-500/20 border border-rose-400/40 text-rose-200 px-4 py-3 rounded-lg mb-4 backdrop-blur-md">
              {err}
            </div>
          )}
        </section>

        {/* DATA SECTIONS – glass layout */}
        <section className="grid md:grid-cols-3 gap-6">
          {/* Ranked donors */}
          <div className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-2xl backdrop-blur-lg">
            <h3 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-200" />
              Top Blood Warriors
            </h3>
            <div className="space-y-3">
              {rank.map((d, index) => (
                <div key={d.id} className="bg-white/10 p-3 rounded-lg border border-white/20 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-100">
                      #{index + 1} {d.name}
                    </span>
                    <span className="bg-slate-900/70 text-slate-100 px-2 py-1 rounded-full text-xs font-bold border border-white/10">
                      {d.score}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {d.location}
                  </div>
                </div>
              ))}
              {!rank.length && (
                <div className="text-center text-slate-400 py-8">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p>Click “Rank Warriors”</p>
                </div>
              )}
            </div>
          </div>

          {/* Bridges */}
          <div className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-2xl backdrop-blur-lg">
            <h3 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-200" />
              Warrior Connections
            </h3>
            <div className="space-y-2">
              {bridges.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2 bg-white/10 rounded border border-white/20 backdrop-blur-md">
                  <span className="text-sm text-slate-200">
                    Req #{b.request_id} → Warrior {b.donor_user_id}
                  </span>
                  <span className={`text-sm font-semibold ${getStatusColor(b.status)}`}>
                    {b.status}
                  </span>
                </div>
              ))}
              {!bridges.length && (
                <div className="text-center text-slate-400 py-8">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p>No connections yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Open requests */}
          <div className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-2xl backdrop-blur-lg">
            <h3 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-slate-200" />
              Active Blood Requests
            </h3>
            <div className="space-y-3">
              {openRequests.map((r) => (
                <div key={r.id} className="bg-white/10 p-3 rounded-lg border border-white/20 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-100">#{r.id} - {r.blood_group}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getUrgencyPill(r.urgency)}`}>
                      {r.urgency.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 space-y-1">
                    <div className="flex items-center gap-1">
                      <Droplets className="w-3 h-3" />
                      {r.units} units needed
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {r.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(r.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {!openRequests.length && (
                <div className="text-center text-slate-400 py-8">
                  <Heart className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p>No active requests</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* MESSAGES */}
        {messages.length > 0 && (
          <section className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-2xl mt-6 backdrop-blur-lg">
            <h3 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-slate-200" />
              Recent Communications
            </h3>
            <div className="space-y-2">
              {messages.slice(-5).reverse().map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2 bg-white/10 rounded border border-white/20 backdrop-blur-md">
                  <span className="text-sm text-slate-200">
                    {m.channel.toUpperCase()} • {m.direction} • {m.to_phone || "—"}
                  </span>
                  <span className="text-xs text-slate-100 font-semibold opacity-90">
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
