import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="page-header">
      <div className="page-header__title">
        <h1>{title}</h1>
        {subtitle ? <span className="page-header__subtitle">{subtitle}</span> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  );
}
