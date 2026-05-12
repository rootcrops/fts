import { useState } from "react";

import { usePolish, useSuggestPadding } from "../hooks/useAI";
import type { PaddingSuggestion } from "../api/types";

interface Props {
  rawText: string;
  actualHours: number;
  reportedHours: number;
  taskDescription: string;
  onAcceptPolished: (text: string) => void;
  onApplyPadding: (suggestion: PaddingSuggestion) => void;
}

export default function AIPanel({
  rawText,
  actualHours,
  reportedHours,
  taskDescription,
  onAcceptPolished,
  onApplyPadding,
}: Props) {
  const polish = usePolish();
  const padding = useSuggestPadding();
  const [showDiff, setShowDiff] = useState(false);

  return (
    <div className="ai-panel">
      <div className="ai-panel__title">AI assist</div>

      <div className="ai-panel__actions">
        <button
          type="button"
          className="btn btn--sm"
          disabled={!rawText.trim() || polish.isPending}
          onClick={() => {
            setShowDiff(true);
            polish.mutate(rawText);
          }}
        >
          {polish.isPending ? "Polishing…" : "Polish description"}
        </button>
        <button
          type="button"
          className="btn btn--sm"
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
      </div>

      {polish.error ? (
        <p className="ai-panel__error">Polish failed: {String(polish.error)}</p>
      ) : null}
      {polish.data && showDiff ? (
        <div className="vstack" style={{ marginBottom: "var(--space-2)" }}>
          <div className="ai-panel__diff">
            <div>
              <div className="ai-panel__diff-label">Raw</div>
              {rawText || <span className="muted">(empty)</span>}
            </div>
            <div>
              <div className="ai-panel__diff-label">Polished</div>
              {polish.data.polished}
            </div>
          </div>
          <div className="hstack">
            <button
              type="button"
              className="btn btn--sm btn--primary"
              onClick={() => {
                onAcceptPolished(polish.data!.polished);
              }}
            >
              Accept polished
            </button>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => setShowDiff(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {padding.error ? (
        <p className="ai-panel__error">Padding failed: {String(padding.error)}</p>
      ) : null}
      {padding.data ? (
        <div className="ai-panel__result vstack">
          <div>
            <strong>Suggested hours:</strong>{" "}
            <span className="mono">{padding.data.suggestedHours.toFixed(2)}</span>
          </div>
          <div>
            <strong>Rationale.</strong> <span className="muted">{padding.data.rationale}</span>
          </div>
          {padding.data.addedActivities.length > 0 ? (
            <div>
              <strong>Activities to add:</strong>
              <ul style={{ margin: "4px 0 0 18px" }}>
                {padding.data.addedActivities.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="hstack">
            <button
              type="button"
              className="btn btn--sm btn--primary"
              onClick={() => onApplyPadding(padding.data!)}
            >
              Apply padding
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
