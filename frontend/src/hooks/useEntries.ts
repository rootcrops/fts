import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createProject, listProjects } from "../api/projects";
import { createTask, listTasks, updateTask } from "../api/tasks";
import type { ProjectCreate, TaskCreate, TaskUpdate } from "../api/types";

export const useProjects = () =>
  useQuery({ queryKey: ["projects"], queryFn: listProjects });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: ProjectCreate) => createProject(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useTasks = (date?: string) =>
  useQuery({
    queryKey: ["tasks", { date }],
    queryFn: () => listTasks({ date }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
};
