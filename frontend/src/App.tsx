import { useAuth } from "react-oidc-context";
import { Link, Route, Routes } from "react-router-dom";

import RequireAuth from "./auth/RequireAuth";
import Callback from "./auth/Callback";
import { useMe } from "./hooks/useMe";
import Dashboard from "./pages/Dashboard";
import NewEntry from "./pages/NewEntry";
import Reports from "./pages/Reports";

function HeaderBar() {
  const auth = useAuth();
  const { data: me } = useMe();
  return (
    <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
      {me ? (
        <span style={{ fontSize: 13, opacity: 0.8 }}>
          {me.email} <em>({me.role})</em>
        </span>
      ) : null}
      <button type="button" onClick={() => void auth.signoutRedirect()}>
        Logout
      </button>
    </div>
  );
}

function Shell() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
      <nav style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <Link to="/">Dashboard</Link>
        <Link to="/new">New entry</Link>
        <Link to="/reports">Reports</Link>
        <HeaderBar />
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<NewEntry />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<Callback />} />
      <Route
        path="*"
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
