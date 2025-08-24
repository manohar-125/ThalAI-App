// src/App.jsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="p-3 border-b flex gap-4">
        <Link to="/">Admin</Link>
      </nav>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
