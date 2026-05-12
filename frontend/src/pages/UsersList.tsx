import PageHeader from "../components/layout/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import Pill from "../components/ui/Pill";
import { useUsers } from "../hooks/useUsers";

function formatDate(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

export default function UsersList() {
  const { data: users, isLoading, error } = useUsers();

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Synced from Authentik on first sign-in. Roles are managed there."
      />

      {isLoading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <EmptyState title="Failed to load users" hint={String(error)} />
      ) : !users || users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Created</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.name || <span className="muted">—</span>}</td>
                  <td>
                    <Pill kind={u.role}>{u.role}</Pill>
                  </td>
                  <td className="mono">{formatDate(u.createdAt)}</td>
                  <td className="mono muted">{u.id.slice(0, 8)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
