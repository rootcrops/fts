import { useState } from "react";

import PageHeader from "../components/layout/PageHeader";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "../hooks/useEntries";
import { useMe } from "../hooks/useMe";
import { useToast } from "../hooks/useToast";
import type { Project } from "../api/types";

export default function ProjectsList() {
  const { data: projects, isLoading } = useProjects();
  const { data: me } = useMe();
  const isAdmin = me?.role === "admin";

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const toast = useToast();

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Shared across the workspace"
        actions={
          isAdmin && !creating ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setCreating(true)}
            >
              + New project
            </button>
          ) : null
        }
      />

      {isAdmin && creating ? (
        <CreateProjectRow
          pending={createProject.isPending}
          onCancel={() => setCreating(false)}
          onSubmit={(payload) =>
            createProject.mutate(payload, {
              onSuccess: () => {
                setCreating(false);
                toast.push("Project created", "success");
              },
              onError: (e) => toast.push(String(e), "error"),
            })
          }
        />
      ) : null}

      {isLoading ? (
        <p className="muted">Loading…</p>
      ) : !projects || projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          hint={isAdmin ? "Click + New project to add one." : "Ask an admin to create one."}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }} />
                <th>Name</th>
                <th>Client</th>
                <th style={{ width: 80 }}>ID</th>
                {isAdmin ? <th className="col-actions">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {projects.map((p) =>
                editingId === p.id ? (
                  <EditProjectRow
                    key={p.id}
                    project={p}
                    isAdmin={isAdmin}
                    pending={updateProject.isPending}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(payload) =>
                      updateProject.mutate(
                        { id: p.id, payload },
                        {
                          onSuccess: () => {
                            setEditingId(null);
                            toast.push("Project updated", "success");
                          },
                          onError: (e) => toast.push(String(e), "error"),
                        },
                      )
                    }
                  />
                ) : (
                  <tr key={p.id}>
                    <td>
                      <span
                        className="color-swatch"
                        style={{ background: p.color }}
                        aria-hidden="true"
                      />
                    </td>
                    <td>{p.name}</td>
                    <td className="muted">{p.client || "—"}</td>
                    <td className="mono muted">{p.id}</td>
                    {isAdmin ? (
                      <td className="col-actions">
                        <button
                          type="button"
                          className="btn btn--sm"
                          onClick={() => setEditingId(p.id)}
                        >
                          Edit
                        </button>{" "}
                        <button
                          type="button"
                          className="btn btn--sm btn--danger"
                          onClick={() => setDeleteTarget(p)}
                        >
                          Delete
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget ? (
        <ConfirmDialog
          title="Delete project?"
          message={
            <>
              Project <strong>{deleteTarget.name}</strong> and all its tasks will be permanently
              deleted. This cannot be undone.
            </>
          }
          confirmLabel="Delete"
          destructive
          pending={deleteProject.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() =>
            deleteProject.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
                toast.push("Project deleted", "success");
              },
              onError: (e) => toast.push(String(e), "error"),
            })
          }
        />
      ) : null}
    </div>
  );
}

function CreateProjectRow({
  pending,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: { name: string; color: string; client: string | null }) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#22c55e");
  const [client, setClient] = useState("");

  return (
    <form
      className="card"
      style={{ marginBottom: "var(--space-3)" }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), color, client: client.trim() || null });
      }}
    >
      <div className="card__header">New project</div>
      <div className="card__body">
        <div className="row-3">
          <label className="field">
            <span className="field__label">Name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="field">
            <span className="field__label">Client</span>
            <input
              className="input"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label className="field">
            <span className="field__label">Color</span>
            <input
              type="color"
              className="input input--color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="card__footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button type="button" className="btn" onClick={onCancel} disabled={pending}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Create"}
        </button>
      </div>
    </form>
  );
}

function EditProjectRow({
  project,
  isAdmin,
  pending,
  onCancel,
  onSubmit,
}: {
  project: Project;
  isAdmin: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: { name: string; color: string; client: string | null }) => void;
}) {
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color);
  const [client, setClient] = useState(project.client ?? "");

  return (
    <tr>
      <td>
        <input
          type="color"
          className="input input--color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </td>
      <td>
        <input
          className="input input--sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </td>
      <td>
        <input
          className="input input--sm"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="—"
        />
      </td>
      <td className="mono muted">{project.id}</td>
      {isAdmin ? (
        <td className="col-actions">
          <button
            type="button"
            className="btn btn--sm btn--primary"
            disabled={pending || !name.trim()}
            onClick={() =>
              onSubmit({ name: name.trim(), color, client: client.trim() || null })
            }
          >
            Save
          </button>{" "}
          <button type="button" className="btn btn--sm" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
        </td>
      ) : null}
    </tr>
  );
}
