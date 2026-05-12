export interface Project {
  id: number;
  name: string;
  color: string;
  client: string | null;
}

export interface ProjectCreate {
  name: string;
  color?: string;
  client?: string | null;
}

export interface ProjectUpdate {
  name?: string;
  color?: string;
  client?: string | null;
}

export type TaskStatus = "draft" | "submitted";

export interface PaddingSuggestion {
  suggestedHours: number;
  addedActivities: string[];
  rationale: string;
}

export interface Task {
  id: number;
  projectId: number;
  userId: string;
  name: string;
  descriptionRaw: string;
  descriptionPolished: string | null;
  actualHours: number;
  reportedHours: number;
  date: string;
  aiSuggestion: PaddingSuggestion | null;
  status: TaskStatus;
}

export interface TaskCreate {
  projectId: number;
  name: string;
  descriptionRaw: string;
  descriptionPolished?: string | null;
  actualHours: number;
  reportedHours: number;
  date: string;
  aiSuggestion?: PaddingSuggestion | null;
  status?: TaskStatus;
}

export interface TaskUpdate {
  name?: string;
  descriptionRaw?: string;
  descriptionPolished?: string | null;
  actualHours?: number;
  reportedHours?: number;
  date?: string;
  aiSuggestion?: PaddingSuggestion | null;
  status?: TaskStatus;
}

export type Role = "admin" | "manager" | "user";

export interface User {
  id: string;
  sub: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}
