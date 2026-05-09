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

export type TaskStatus = "draft" | "submitted";

export interface PaddingSuggestion {
  suggestedHours: number;
  addedActivities: string[];
  rationale: string;
}

export interface Task {
  id: number;
  projectId: number;
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
