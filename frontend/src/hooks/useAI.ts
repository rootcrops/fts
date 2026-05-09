import { useMutation } from "@tanstack/react-query";

import { polish, suggestPadding } from "../api/ai";

export const usePolish = () =>
  useMutation({ mutationFn: (rawText: string) => polish(rawText) });

export const useSuggestPadding = () =>
  useMutation({
    mutationFn: (input: {
      actualHours: number;
      targetHours: number;
      taskDescription: string;
    }) => suggestPadding(input),
  });
