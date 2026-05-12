import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCreateTask, useProjects, useUpdateTask } from "../hooks/useEntries";
import { useToast } from "../hooks/useToast";
import AIPanel from "./AIPanel";
import type { PaddingSuggestion, Task, TaskCreate } from "../api/types";

interface Props {
  initial?: Task;
  readOnly?: boolean;
  onSaved?: (task: Task) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function TaskForm({ initial, readOnly, onSaved }: Props) {
  const { data: projects } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = !!initial;

  const [projectId, setProjectId] = useState<number | "">(initial?.projectId ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [descriptionRaw, setDescriptionRaw] = useState(initial?.descriptionRaw ?? "");
  const [descriptionPolished, setDescriptionPolished] = useState(
    initial?.descriptionPolished ?? "",
  );
  const [actualHours, setActualHours] = useState(initial?.actualHours ?? 3);
  const [reportedHours, setReportedHours] = useState(initial?.reportedHours ?? 8);
  const [date, setDate] = useState(initial?.date ?? today());
  const [aiSuggestion, setAiSuggestion] = useState<PaddingSuggestion | null>(
    initial?.aiSuggestion ?? null,
  );

  const pending = createTask.isPending || updateTask.isPending;
  const disabled = readOnly || pending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectId === "") return;

    if (isEdit) {
      updateTask.mutate(
        {
          id: initial.id,
          payload: {
            name,
            descriptionRaw,
            descriptionPolished: descriptionPolished || null,
            actualHours,
            reportedHours,
            date,
            aiSuggestion,
          },
        },
        {
          onSuccess: (saved) => {
            toast.push("Task saved", "success");
            onSaved?.(saved);
          },
          onError: (err) => toast.push(String(err), "error"),
        },
      );
    } else {
      const payload: TaskCreate = {
        projectId: Number(projectId),
        name,
        descriptionRaw,
        descriptionPolished: descriptionPolished || null,
        actualHours,
        reportedHours,
        date,
        aiSuggestion,
      };
      createTask.mutate(payload, {
        onSuccess: (saved) => {
          toast.push("Task created", "success");
          if (onSaved) onSaved(saved);
          else navigate("/tasks");
        },
        onError: (err) => toast.push(String(err), "error"),
      });
    }
  };

  const applyPadding = (s: PaddingSuggestion) => {
    setReportedHours(s.suggestedHours);
    setAiSuggestion(s);
    if (s.addedActivities.length > 0) {
      const block = s.addedActivities.map((a) => `- ${a}`).join("\n");
      const target = descriptionPolished || descriptionRaw;
      const next = target ? `${target}\n\n${block}` : block;
      if (descriptionPolished) {
        setDescriptionPolished(next);
      } else {
        setDescriptionRaw(next);
      }
    }
    toast.push("Padding applied", "success");
  };

  const acceptPolished = (text: string) => {
    setDescriptionPolished(text);
    toast.push("Polished text accepted", "success");
  };

  return (
    <form onSubmit={submit} className="vstack" style={{ maxWidth: 760 }}>
      <div className="row-2">
        <label className="field">
          <span className="field__label">Project</span>
          <select
            className="select"
            value={projectId}
            onChange={(e) =>
              setProjectId(e.target.value === "" ? "" : Number(e.target.value))
            }
            required
            disabled={disabled || isEdit}
          >
            <option value="">— choose —</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {isEdit ? <span className="field__hint">Project cannot be changed.</span> : null}
        </label>
        <label className="field">
          <span className="field__label">Date</span>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={disabled}
          />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Task name</span>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={disabled}
        />
      </label>

      <label className="field">
        <span className="field__label">Raw description</span>
        <textarea
          className="textarea"
          rows={4}
          value={descriptionRaw}
          onChange={(e) => setDescriptionRaw(e.target.value)}
          required
          disabled={disabled}
          placeholder="Your casual notes about what you did."
        />
      </label>

      <label className="field">
        <span className="field__label">Polished description</span>
        <textarea
          className="textarea"
          rows={4}
          value={descriptionPolished}
          onChange={(e) => setDescriptionPolished(e.target.value)}
          disabled={disabled}
          placeholder="Corporate-speak version. Use AI assist below to generate."
        />
      </label>

      <div className="row-3">
        <label className="field">
          <span className="field__label">Actual hours</span>
          <input
            type="number"
            step="0.25"
            min="0"
            className="input input--mono"
            value={actualHours}
            onChange={(e) => setActualHours(Number(e.target.value))}
            disabled={disabled}
          />
        </label>
        <label className="field">
          <span className="field__label">Reported hours</span>
          <input
            type="number"
            step="0.25"
            min="0"
            className="input input--mono"
            value={reportedHours}
            onChange={(e) => setReportedHours(Number(e.target.value))}
            disabled={disabled}
          />
        </label>
        <div className="field">
          <span className="field__label">Gap</span>
          <div className="input input--mono" style={{ background: "var(--color-surface)" }}>
            {(reportedHours - actualHours).toFixed(2)}h
          </div>
        </div>
      </div>

      {!readOnly ? (
        <AIPanel
          rawText={descriptionRaw}
          actualHours={actualHours}
          reportedHours={reportedHours}
          taskDescription={descriptionRaw || name}
          onAcceptPolished={acceptPolished}
          onApplyPadding={applyPadding}
        />
      ) : null}

      {aiSuggestion ? (
        <div className="muted" style={{ fontSize: 12 }}>
          AI suggestion stored: {aiSuggestion.suggestedHours.toFixed(2)}h —{" "}
          {aiSuggestion.rationale}
        </div>
      ) : null}

      {!readOnly ? (
        <div className="hstack">
          <button type="submit" className="btn btn--primary" disabled={disabled}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create task"}
          </button>
          <button
            type="button"
            className="btn"
            disabled={pending}
            onClick={() => navigate("/tasks")}
          >
            Cancel
          </button>
        </div>
      ) : null}
    </form>
  );
}
