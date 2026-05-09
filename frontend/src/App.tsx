import { Link, Route, Routes } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import NewEntry from "./pages/NewEntry";
import Reports from "./pages/Reports";

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
      <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/">Dashboard</Link>
        <Link to="/new">New entry</Link>
        <Link to="/reports">Reports</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<NewEntry />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </div>
  );
}
