import { usePolish, useSuggestPadding } from "../hooks/useAI";

interface Props {
  rawText: string;
  actualHours: number;
  reportedHours: number;
  taskDescription: string;
  onUsePolished: (text: string) => void;
}

export default function AIPanel({
  rawText,
  actualHours,
  reportedHours,
  taskDescription,
  onUsePolished,
}: Props) {
  const polish = usePolish();
  const padding = useSuggestPadding();

  return (
    <fieldset style={{ display: "grid", gap: 8, padding: 12, border: "1px solid #ddd" }}>
      <legend>AI assist</legend>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          disabled={!rawText.trim() || polish.isPending}
          onClick={() => polish.mutate(rawText)}
        >
          {polish.isPending ? "Polishing…" : "Polish"}
        </button>
        {polish.data && (
          <button type="button" onClick={() => onUsePolished(polish.data.polished)}>
            Use polished
          </button>
        )}
      </div>
      {polish.error && <p style={{ color: "crimson" }}>{String(polish.error)}</p>}
      {polish.data && (
        <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 8 }}>
          {polish.data.polished}
        </pre>
      )}

      <button
        type="button"
        disabled={!taskDescription.trim() || padding.isPending}
        onClick={() =>
          padding.mutate({
            actualHours,
            targetHours: reportedHours,
            taskDescription,
          })
        }
      >
        {padding.isPending ? "Suggesting…" : "Suggest padding"}
      </button>
      {padding.error && <p style={{ color: "crimson" }}>{String(padding.error)}</p>}
      {padding.data && (
        <div style={{ background: "#f6f6f6", padding: 8 }}>
          <p>
            <strong>Suggested hours:</strong> {padding.data.suggestedHours}
          </p>
          <p>
            <strong>Rationale:</strong> {padding.data.rationale}
          </p>
          <ul>
            {padding.data.addedActivities.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </fieldset>
  );
}
