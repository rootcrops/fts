import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/layout/PageHeader";
import TaskForm from "../components/TaskForm";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Pill from "../components/ui/Pill";
import {
  useDeleteTask,
  useProjects,
  useTask,
  useUpdateTask,
} from "../hooks/useEntries";
import { useMe } from "../hooks/useMe";
import { useToast } from "../hooks/useToast";

export default function TaskDetail() {
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const navigate = useNavigate();
  const toast = useToast();

  const { data: task, isLoading, error } = useTask(id);
  const { data: projects } = useProjects();
  const { data: me } = useMe();

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <p className="muted">Loading…</p>;
  if (error || !task) {
    return (
      <div>
        <PageHeader
          title="Task not found"
          actions={
            <Link to="/tasks" className="btn">
              ← Back to tasks
            </Link>
          }
        />
        <EmptyState
          title="This task is unavailable"
          hint="It may have been deleted, or you may not have permission to view it."
        />
      </div>
    );
  }

  const project = projects?.find((p) => p.id === task.projectId);
  const isOwner = me?.id === task.userId;
  const canWrite = isOwner || me?.role === "admin";

  const toggleStatus = () =>
    updateTask.mutate(
      {
        id: task.id,
        payload: { status: task.status === "draft" ? "submitted" : "draft" },
      },
      {
        onSuccess: () =>
          toast.push(
            task.status === "draft" ? "Task submitted" : "Reverted to draft",
            "success",
          ),
        onError: (e) => toast.push(String(e), "error"),
      },
    );

  return (
    <div>
      <PageHeader
        title={task.name || "Untitled task"}
        subtitle={`${project?.name ?? `Project #${task.projectId}`} · ${task.date}`}
        actions={
          <>
            <Link to="/tasks" className="btn">
              ← Back
            </Link>
            {canWrite ? (
              <button
                type="button"
                className="btn"
                onClick={toggleStatus}
                disabled={updateTask.isPending}
              >
                {task.status === "draft" ? "Submit" : "Revert to draft"}
              </button>
            ) : null}
            {canWrite ? (
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            ) : null}
          </>
        }
      />

      <div className="hstack" style={{ marginBottom: "var(--space-4)" }}>
        <Pill kind={task.status}>{task.status}</Pill>
        {!canWrite ? <span className="muted">Read-only (not your task)</span> : null}
      </div>

      <TaskForm initial={task} readOnly={!canWrite} onSaved={() => undefined} />

      {confirmDelete ? (
        <ConfirmDialog
          title="Delete task?"
          message={
            <>
              Task <strong>{task.name}</strong> from {task.date} will be permanently deleted.
            </>
          }
          confirmLabel="Delete"
          destructive
          pending={deleteTask.isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() =>
            deleteTask.mutate(task.id, {
              onSuccess: () => {
                toast.push("Task deleted", "success");
                navigate("/tasks");
              },
              onError: (e) => toast.push(String(e), "error"),
            })
          }
        />
      ) : null}
    </div>
  );
}
