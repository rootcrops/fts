import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../components/layout/PageHeader";
import TasksTable from "../components/TasksTable";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import {
  useDeleteTask,
  useProjects,
  useTasks,
  useUpdateTask,
} from "../hooks/useEntries";
import { useMe } from "../hooks/useMe";
import { useToast } from "../hooks/useToast";
import { useUsers } from "../hooks/useUsers";
import type { Task, TaskStatus } from "../api/types";

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function TasksList() {
  const { data: me } = useMe();
  const canSeeOthers = me?.role === "admin" || me?.role === "manager";

  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [projectId, setProjectId] = useState<number | "">("");
  const [userId, setUserId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");

  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  // Server only supports date (single day). We fetch all matching project/user
  // and filter date range + status client-side.
  const { data: rawTasks, isLoading } = useTasks({
    projectId: projectId === "" ? undefined : Number(projectId),
    userId: canSeeOthers && userId ? userId : undefined,
  });

  const tasks = useMemo(() => {
    const list = rawTasks ?? [];
    return list.filter((t) => {
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      return true;
    });
  }, [rawTasks, dateFrom, dateTo, statusFilter]);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const submitTask = (t: Task) =>
    updateTask.mutate(
      { id: t.id, payload: { status: "submitted" } },
      {
        onSuccess: () => toast.push(`Submitted "${t.name}"`, "success"),
        onError: (e) => toast.push(String(e), "error"),
      },
    );

  const revertTask = (t: Task) =>
    updateTask.mutate(
      { id: t.id, payload: { status: "draft" } },
      {
        onSuccess: () => toast.push(`Reverted "${t.name}" to draft`, "success"),
        onError: (e) => toast.push(String(e), "error"),
      },
    );

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={canSeeOthers ? "All tasks" : "Your tasks"}
        actions={
          <Link to="/tasks/new" className="btn btn--primary">
            + New entry
          </Link>
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
        <label className="field">
          <span className="field__label">Status</span>
          <select
            className="select input--sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "")}
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
          </select>
        </label>
        <div className="toolbar__spacer" />
        <button
          type="button"
          className="btn"
          onClick={() => {
            setDateFrom(firstOfMonth());
            setDateTo(today());
            setProjectId("");
            setUserId("");
            setStatusFilter("");
          }}
        >
          Reset
        </button>
      </div>

      <TasksTable
        tasks={tasks}
        projects={projects}
        users={users}
        loading={isLoading}
        showUser={canSeeOthers}
        onSubmitTask={submitTask}
        onRevertTask={revertTask}
        onDeleteTask={(t) => setDeleteTarget(t)}
        emptyTitle="No tasks match your filters"
        emptyHint="Adjust the date range or clear filters to see more."
      />

      <div style={{ marginTop: "var(--space-3)" }} className="muted">
        {tasks.length} {tasks.length === 1 ? "task" : "tasks"} shown
      </div>

      {deleteTarget ? (
        <ConfirmDialog
          title="Delete task?"
          message={
            <>
              Task <strong>{deleteTarget.name}</strong> from {deleteTarget.date} will be permanently
              deleted.
            </>
          }
          confirmLabel="Delete"
          destructive
          pending={deleteTask.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() =>
            deleteTask.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
                toast.push("Task deleted", "success");
              },
              onError: (e) => toast.push(String(e), "error"),
            })
          }
        />
      ) : null}
    </div>
  );
}
