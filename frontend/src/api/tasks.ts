import { api } from "./client";
import type { Task, TaskCreate, TaskUpdate } from "./types";

export const listTasks = (params: { date?: string; projectId?: number } = {}) => {
  const qs = new URLSearchParams();
  if (params.date) qs.set("date", params.date);
  if (params.projectId !== undefined) qs.set("projectId", String(params.projectId));
  const tail = qs.toString();
  return api<Task[]>(`/tasks${tail ? `?${tail}` : ""}`);
};

export const createTask = (payload: TaskCreate) =>
  api<Task>("/tasks", { method: "POST", body: JSON.stringify(payload) });

export const updateTask = (id: number, payload: TaskUpdate) =>
  api<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
