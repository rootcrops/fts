import { api } from "./client";
import type { Project, ProjectCreate, ProjectUpdate } from "./types";

export const listProjects = () => api<Project[]>("/projects");

export const getProject = (id: number) => api<Project>(`/projects/${id}`);

export const createProject = (payload: ProjectCreate) =>
  api<Project>("/projects", { method: "POST", body: JSON.stringify(payload) });

export const updateProject = (id: number, payload: ProjectUpdate) =>
  api<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

export const deleteProject = (id: number) =>
  api<void>(`/projects/${id}`, { method: "DELETE" });
