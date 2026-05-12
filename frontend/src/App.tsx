import { Navigate, Route, Routes } from "react-router-dom";

import Callback from "./auth/Callback";
import RequireAuth from "./auth/RequireAuth";
import Shell from "./components/layout/Shell";
import { useMe } from "./hooks/useMe";
import Dashboard from "./pages/Dashboard";
import ProjectsList from "./pages/ProjectsList";
import Reports from "./pages/Reports";
import TaskDetail from "./pages/TaskDetail";
import TaskNew from "./pages/TaskNew";
import TasksList from "./pages/TasksList";
import UsersList from "./pages/UsersList";

function AdminRoute({ children }: { children: JSX.Element }) {
  const { data: me, isLoading } = useMe();
  if (isLoading) return null;
  if (me?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<Callback />} />
      <Route
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<TasksList />} />
        <Route path="/tasks/new" element={<TaskNew />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/reports" element={<Reports />} />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UsersList />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
