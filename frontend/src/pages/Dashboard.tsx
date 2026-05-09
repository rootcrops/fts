import { Link } from "react-router-dom";

import ProjectList from "../components/ProjectList";
import { useTasks, useUpdateTask } from "../hooks/useEntries";

const today = () => new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const date = today();
  const { data: tasks, isLoading } = useTasks(date);
  const updateTask = useUpdateTask();

  return (
    <div>
      <h1>Dashboard — {date}</h1>
      <ProjectList />

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2>Today's tasks</h2>
          <Link to="/new">+ New entry</Link>
        </div>
        {isLoading ? (
          <p>Loading…</p>
        ) : tasks && tasks.length > 0 ? (
          <ul>
            {tasks.map((t) => (
              <li key={t.id} style={{ marginBottom: 8 }}>
                <strong>{t.name}</strong> — {t.actualHours}h actual / {t.reportedHours}h reported —{" "}
                <em>{t.status}</em>
                {t.status === "draft" && (
                  <button
                    type="button"
                    style={{ marginLeft: 8 }}
                    disabled={updateTask.isPending}
                    onClick={() =>
                      updateTask.mutate({ id: t.id, payload: { status: "submitted" } })
                    }
                  >
                    Submit
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No tasks today.</p>
        )}
      </section>
    </div>
  );
}
