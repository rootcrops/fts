import { useMemo } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../components/layout/PageHeader";
import TasksTable from "../components/TasksTable";
import { useProjects, useTasks, useUpdateTask } from "../hooks/useEntries";
import { useMe } from "../hooks/useMe";
import { useToast } from "../hooks/useToast";
import type { Task } from "../api/types";

const today = () => new Date().toISOString().slice(0, 10);

function weekStart() {
  const d = new Date();
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon-based
  d.setDate(d.getDate() - dow);
  return d.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const date = today();
  const { data: tasks = [], isLoading } = useTasks({});
  const { data: projects } = useProjects();
  const { data: me } = useMe();
  const updateTask = useUpdateTask();
  const toast = useToast();

  const startOfWeek = weekStart();

  const todays = useMemo(() => tasks.filter((t) => t.date === date), [tasks, date]);
  const week = useMemo(
    () => tasks.filter((t) => t.date >= startOfWeek && t.date <= date),
    [tasks, startOfWeek, date],
  );
  const drafts = useMemo(() => tasks.filter((t) => t.status === "draft"), [tasks]);

  const todayActual = todays.reduce((s, t) => s + Number(t.actualHours), 0);
  const todayReported = todays.reduce((s, t) => s + Number(t.reportedHours), 0);
  const weekReported = week.reduce((s, t) => s + Number(t.reportedHours), 0);

  const submit = (t: Task) =>
    updateTask.mutate(
      { id: t.id, payload: { status: "submitted" } },
      {
        onSuccess: () => toast.push(`Submitted "${t.name}"`, "success"),
        onError: (e) => toast.push(String(e), "error"),
      },
    );

  return (
    <div>
      <PageHeader
        title={`Welcome${me?.name ? `, ${me.name.split(" ")[0]}` : ""}`}
        subtitle={date}
        actions={
          <Link to="/tasks/new" className="btn btn--primary">
            + New entry
          </Link>
        }
      />

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi__label">Today — actual</div>
          <div className="kpi__value">{todayActual.toFixed(2)}h</div>
          <div className="kpi__sub">{todays.length} tasks logged today</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Today — reported</div>
          <div className="kpi__value">{todayReported.toFixed(2)}h</div>
          <div className="kpi__sub">After AI padding</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">This week — reported</div>
          <div className="kpi__value">{weekReported.toFixed(2)}h</div>
          <div className="kpi__sub">Since {startOfWeek}</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Drafts pending</div>
          <div className="kpi__value">{drafts.length}</div>
          <div className="kpi__sub">Across all dates</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
        <h2>Today&apos;s tasks</h2>
        <Link to="/tasks" className="btn btn--link">
          View all tasks →
        </Link>
      </div>
      <TasksTable
        tasks={todays}
        projects={projects}
        loading={isLoading}
        onSubmitTask={submit}
        emptyTitle="No tasks logged today"
        emptyHint="Click + New entry to log your first task of the day."
      />
    </div>
  );
}
