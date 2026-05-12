import { Link } from "react-router-dom";

import Pill from "./ui/Pill";
import EmptyState from "./ui/EmptyState";
import type { Project, Task, User } from "../api/types";

interface Props {
  tasks: Task[];
  projects?: Project[];
  users?: User[];
  loading?: boolean;
  showUser?: boolean;
  onSubmitTask?: (task: Task) => void;
  onRevertTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  emptyTitle?: string;
  emptyHint?: string;
}

export default function TasksTable({
  tasks,
  projects,
  users,
  loading,
  showUser,
  onSubmitTask,
  onRevertTask,
  onDeleteTask,
  emptyTitle = "No tasks",
  emptyHint,
}: Props) {
  if (loading) {
    return <p className="muted">Loading…</p>;
  }
  if (!tasks.length) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />;
  }

  const projectMap = new Map<number, Project>((projects ?? []).map((p) => [p.id, p]));
  const userMap = new Map<string, User>((users ?? []).map((u) => [u.id, u]));

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 100 }}>Date</th>
            <th>Project</th>
            <th>Task</th>
            {showUser ? <th>Owner</th> : null}
            <th className="num" style={{ width: 90 }}>
              Actual
            </th>
            <th className="num" style={{ width: 90 }}>
              Reported
            </th>
            <th style={{ width: 110 }}>Status</th>
            <th className="col-actions" style={{ width: 220 }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const project = projectMap.get(t.projectId);
            const owner = userMap.get(t.userId);
            return (
              <tr key={t.id}>
                <td className="mono nowrap">{t.date}</td>
                <td>
                  {project ? (
                    <>
                      <span
                        className="color-swatch"
                        style={{ background: project.color }}
                        aria-hidden="true"
                      />
                      {project.name}
                    </>
                  ) : (
                    <span className="muted">#{t.projectId}</span>
                  )}
                </td>
                <td>
                  <Link to={`/tasks/${t.id}`}>{t.name}</Link>
                </td>
                {showUser ? (
                  <td className="muted">
                    {owner ? owner.email : <span className="mono">{t.userId.slice(0, 8)}</span>}
                  </td>
                ) : null}
                <td className="num">{t.actualHours.toFixed(2)}</td>
                <td className="num">{t.reportedHours.toFixed(2)}</td>
                <td>
                  <Pill kind={t.status}>{t.status}</Pill>
                </td>
                <td className="col-actions">
                  <Link className="btn btn--sm" to={`/tasks/${t.id}`}>
                    Open
                  </Link>{" "}
                  {t.status === "draft" && onSubmitTask ? (
                    <button
                      type="button"
                      className="btn btn--sm btn--primary"
                      onClick={() => onSubmitTask(t)}
                    >
                      Submit
                    </button>
                  ) : null}
                  {t.status === "submitted" && onRevertTask ? (
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => onRevertTask(t)}
                    >
                      Revert
                    </button>
                  ) : null}
                  {onDeleteTask ? (
                    <>
                      {" "}
                      <button
                        type="button"
                        className="btn btn--sm btn--danger"
                        onClick={() => onDeleteTask(t)}
                      >
                        Delete
                      </button>
                    </>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
