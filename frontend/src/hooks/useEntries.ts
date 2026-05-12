import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "../api/projects";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
  type TaskFilters,
} from "../api/tasks";
import type {
  ProjectCreate,
  ProjectUpdate,
  TaskCreate,
  TaskUpdate,
} from "../api/types";

/* Projects */

export const useProjects = () =>
  useQuery({ queryKey: ["projects"], queryFn: listProjects });

export const useProject = (id: number | undefined) =>
  useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id as number),
    enabled: id !== undefined,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: ProjectCreate) => createProject(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProjectUpdate }) =>
      updateProject(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

/* Tasks */

export const useTasks = (filters: TaskFilters = {}) =>
  useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => listTasks(filters),
  });

export const useTask = (id: number | undefined) =>
  useQuery({
    queryKey: ["task", id],
    queryFn: () => getTask(id as number),
    enabled: id !== undefined,
  });

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: TaskCreate) => createTask(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TaskUpdate }) =>
      updateTask(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task", vars.id] });
    },
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
};
