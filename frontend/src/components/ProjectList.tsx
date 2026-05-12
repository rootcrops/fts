import { useState } from "react";

import { useCreateProject, useProjects } from "../hooks/useEntries";
import { useMe } from "../hooks/useMe";

export default function ProjectList() {
  const { data: projects, isLoading } = useProjects();
  const { data: me } = useMe();
  const createProject = useCreateProject();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#22c55e");

  const isAdmin = me?.role === "admin";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createProject.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          setName("");
        },
      },
    );
  };

  return (
    <section style={{ marginBottom: 24 }}>
      <h2>Projects</h2>
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {projects?.map((p) => (
            <li key={p.id} style={{ color: p.color }}>
              {p.name}
              {p.client ? ` — ${p.client}` : ""}
            </li>
          ))}
        </ul>
      )}
      {isAdmin ? (
        <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name"
          />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          <button type="submit" disabled={createProject.isPending}>
            Add
          </button>
        </form>
      ) : null}
    </section>
  );
}
