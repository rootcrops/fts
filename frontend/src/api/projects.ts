import { api } from "./client";
import type { Project, ProjectCreate } from "./types";

export const listProjects = () => api<Project[]>("/projects");

export const createProject = (payload: ProjectCreate) =>
  api<Project>("/projects", { method: "POST", body: JSON.stringify(payload) });
