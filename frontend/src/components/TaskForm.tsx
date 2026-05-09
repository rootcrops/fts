import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCreateTask, useProjects } from "../hooks/useEntries";
import AIPanel from "./AIPanel";

const today = () => new Date().toISOString().slice(0, 10);

export default function TaskForm() {
  const { data: projects } = useProjects();
  const createTask = useCreateTask();
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [descriptionRaw, setDescriptionRaw] = useState("");
  const [descriptionPolished, setDescriptionPolished] = useState("");
  const [actualHours, setActualHours] = useState(3);
  const [reportedHours, setReportedHours] = useState(8);
  const [date, setDate] = useState(today());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectId === "") return;
    createTask.mutate(
      {
        projectId: Number(projectId),
        name,
        descriptionRaw,
        descriptionPolished: descriptionPolished || null,
        actualHours,
        reportedHours,
        date,
      },
      { onSuccess: () => navigate("/") },
    );
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 600 }}>
      <h2>New entry</h2>
      <label>
        Project{" "}
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value === "" ? "" : Number(e.target.value))}
          required
        >
          <option value="">— choose —</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Name <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Raw description
        <textarea
          rows={3}
          value={descriptionRaw}
          onChange={(e) => setDescriptionRaw(e.target.value)}
          required
        />
      </label>
      <label>
        Polished description
        <textarea
          rows={3}
          value={descriptionPolished}
          onChange={(e) => setDescriptionPolished(e.target.value)}
        />
      </label>
      <div style={{ display: "flex", gap: 12 }}>
        <label>
          Actual hours{" "}
          <input
            type="number"
            step="0.25"
            min="0"
            value={actualHours}
            onChange={(e) => setActualHours(Number(e.target.value))}
          />
        </label>
        <label>
          Reported hours{" "}
          <input
            type="number"
            step="0.25"
            min="0"
            value={reportedHours}
            onChange={(e) => setReportedHours(Number(e.target.value))}
          />
        </label>
        <label>
          Date{" "}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      <AIPanel
        rawText={descriptionRaw}
        actualHours={actualHours}
        reportedHours={reportedHours}
        taskDescription={descriptionRaw}
        onUsePolished={(text) => setDescriptionPolished(text)}
      />

      <button type="submit" disabled={createTask.isPending}>
        {createTask.isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
