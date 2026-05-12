import { api } from "./client";
import type { User } from "./types";

export const fetchMe = () => api<User>("/users/me");

export const listUsers = () => api<User[]>("/users");

// Backwards-compatible alias used by hooks/useMe.ts
export type Me = User;
