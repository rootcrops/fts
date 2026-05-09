import { api } from "./client";
import type { PaddingSuggestion } from "./types";

export const polish = (rawText: string) =>
  api<{ polished: string }>("/ai/polish", {
    method: "POST",
    body: JSON.stringify({ rawText }),
  });

export const suggestPadding = (input: {
  actualHours: number;
  targetHours: number;
  taskDescription: string;
}) =>
  api<PaddingSuggestion>("/ai/suggest-padding", {
    method: "POST",
    body: JSON.stringify(input),
  });
