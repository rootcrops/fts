import type { ReactNode } from "react";

interface Props {
  kind?: "draft" | "submitted" | "admin" | "manager" | "user" | "default";
  children: ReactNode;
}

export default function Pill({ kind = "default", children }: Props) {
  const cls = kind === "default" ? "pill" : `pill pill--${kind}`;
  return <span className={cls}>{children}</span>;
}
