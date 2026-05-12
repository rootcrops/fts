import type { ReactNode } from "react";

interface Props {
  title: string;
  hint?: ReactNode;
}

export default function EmptyState({ title, hint }: Props) {
  return (
    <div className="empty-state">
      <div>{title}</div>
      {hint ? <div className="empty-state__hint">{hint}</div> : null}
    </div>
  );
}
