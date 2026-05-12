import { useMemo, useState } from "react";

import PageHeader from "../components/layout/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import { useProjects, useTasks } from "../hooks/useEntries";
import { useMe } from "../hooks/useMe";
import { useUsers } from "../hooks/useUsers";
import type { Project, Task, User } from "../api/types";

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Reports() {
  const { data: me } = useMe();
  const canSeeOthers = me?.role === "admin" || me?.role === "manager";

  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [projectId, setProjectId] = useState<number | "">("");
  const [userId, setUserId] = useState<string>("");

  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  const { data: rawTasks, isLoading } = useTasks({
    projectId: projectId === "" ? undefined : Number(projectId),
    userId: canSeeOthers && userId ? userId : undefined,
  });

  const tasks = useMemo(() => {
    const list = rawTasks ?? [];
    return list.filter((t) => {
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
  }, [rawTasks, dateFrom, dateTo]);

  const totals = useMemo(() => {
    let actual = 0;
    let reported = 0;
    for (const t of tasks) {
      actual += Number(t.actualHours);
      reported += Number(t.reportedHours);
    }
    return { actual, reported, gap: reported - actual };
  }, [tasks]);

  const byProject = useMemo(() => {
    const map = new Map<
      number,
      { project: Project | undefined; tasks: number; actual: number; reported: number }
    >();
    for (const t of tasks) {
      const cur =
        map.get(t.projectId) ?? {
          project: projects?.find((p) => p.id === t.projectId),
          tasks: 0,
          actual: 0,
          reported: 0,
        };
      cur.tasks += 1;
      cur.actual += Number(t.actualHours);
      cur.reported += Number(t.reportedHours);
      map.set(t.projectId, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.reported - a.reported);
  }, [tasks, projects]);

  const byDay = useMemo(() => {
    const map = new Map<string, { date: string; tasks: number; actual: number; reported: number }>();
    for (const t of tasks) {
      const cur =
        map.get(t.date) ?? { date: t.date, tasks: 0, actual: 0, reported: 0 };
      cur.tasks += 1;
      cur.actual += Number(t.actualHours);
      cur.reported += Number(t.reportedHours);
      map.set(t.date, cur);
    }
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [tasks]);

  const downloadCsv = () => {
    const csv = toCsv(tasks, projects ?? [], users ?? []);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fts-tasks-${dateFrom}-to-${dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Aggregated hours by project and day"
        actions={
          <button
            type="button"
            className="btn"
            onClick={downloadCsv}
            disabled={tasks.length === 0}
          >
            Export CSV
          </button>
        }
      />

      <div className="toolbar">
        <label className="field">
          <span className="field__label">From</span>
          <input
            type="date"
            className="input input--sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">To</span>
          <input
            type="date"
            className="input input--sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Project</span>
          <select
            className="select input--sm"
            value={projectId}
            onChange={(e) =>
              setProjectId(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">All projects</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {canSeeOthers ? (
          <label className="field">
            <span className="field__label">User</span>
            <select
              className="select input--sm"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">All users</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi__label">Tasks</div>
          <div className="kpi__value">{tasks.length}</div>
          <div className="kpi__sub">{dateFrom} → {dateTo}</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Actual hours</div>
          <div className="kpi__value">{totals.actual.toFixed(2)}</div>
          <div className="kpi__sub">Sum across filtered tasks</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Reported hours</div>
          <div className="kpi__value">{totals.reported.toFixed(2)}</div>
          <div className="kpi__sub">Padded / billable</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Padding gap</div>
          <div className="kpi__value">{totals.gap.toFixed(2)}</div>
          <div className="kpi__sub">Reported − actual</div>
        </div>
      </div>

      {isLoading ? (
        <p className="muted">Loading…</p>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks in this range"
          hint="Adjust the date range or change filters."
        />
      ) : (
        <div className="vstack" style={{ gap: "var(--space-6)" }}>
          <section>
            <h2 style={{ marginBottom: "var(--space-2)" }}>By project</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Client</th>
                    <th className="num">Tasks</th>
                    <th className="num">Actual</th>
                    <th className="num">Reported</th>
                    <th className="num">Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {byProject.map((row) => (
                    <tr key={row.project?.id ?? "unknown"}>
                      <td>
                        {row.project ? (
                          <>
                            <span
                              className="color-swatch"
                              style={{ background: row.project.color }}
                              aria-hidden="true"
                            />
                            {row.project.name}
                          </>
                        ) : (
                          <span className="muted">Unknown</span>
                        )}
                      </td>
                      <td className="muted">{row.project?.client || "—"}</td>
                      <td className="num">{row.tasks}</td>
                      <td className="num">{row.actual.toFixed(2)}</td>
                      <td className="num">{row.reported.toFixed(2)}</td>
                      <td className="num">{(row.reported - row.actual).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 style={{ marginBottom: "var(--space-2)" }}>By day</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="num">Tasks</th>
                    <th className="num">Actual</th>
                    <th className="num">Reported</th>
                    <th className="num">Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {byDay.map((row) => (
                    <tr key={row.date}>
                      <td className="mono">{row.date}</td>
                      <td className="num">{row.tasks}</td>
                      <td className="num">{row.actual.toFixed(2)}</td>
                      <td className="num">{row.reported.toFixed(2)}</td>
                      <td className="num">{(row.reported - row.actual).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(tasks: Task[], projects: Project[], users: User[]) {
  const pMap = new Map(projects.map((p) => [p.id, p]));
  const uMap = new Map(users.map((u) => [u.id, u]));
  const header = [
    "date",
    "project",
    "client",
    "user",
    "name",
    "actualHours",
    "reportedHours",
    "status",
    "descriptionRaw",
    "descriptionPolished",
  ];
  const rows = tasks.map((t) => {
    const p = pMap.get(t.projectId);
    const u = uMap.get(t.userId);
    return [
      t.date,
      p?.name ?? `#${t.projectId}`,
      p?.client ?? "",
      u?.email ?? t.userId,
      t.name,
      t.actualHours.toFixed(2),
      t.reportedHours.toFixed(2),
      t.status,
      t.descriptionRaw,
      t.descriptionPolished ?? "",
    ]
      .map(csvCell)
      .join(",");
  });
  return [header.join(","), ...rows].join("\n");
}
