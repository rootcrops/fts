import { api } from "./client";
import type { Task, TaskCreate, TaskStatus, TaskUpdate } from "./types";

export interface TaskFilters {
  date?: string;
  projectId?: number;
  userId?: string;
  status?: TaskStatus;
}

export const listTasks = (params: TaskFilters = {}) => {
  const qs = new URLSearchParams();
  if (params.date) qs.set("date", params.date);
  if (params.projectId !== undefined) qs.set("project_id", String(params.projectId));
  if (params.userId) qs.set("user_id", params.userId);
  // Note: backend supports date (single day), projectId, userId. status filtering
  // and date ranges are applied client-side by callers.
  const tail = qs.toString();
  return api<Task[]>(`/tasks${tail ? `?${tail}` : ""}`);
};

export const getTask = (id: number) => api<Task>(`/tasks/${id}`);

export const createTask = (payload: TaskCreate) =>
  api<Task>("/tasks", { method: "POST", body: JSON.stringify(payload) });

export const updateTask = (id: number, payload: TaskUpdate) =>
  api<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

export const deleteTask = (id: number) =>
  api<void>(`/tasks/${id}`, { method: "DELETE" });
