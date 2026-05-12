import { api } from "./client";

export interface Me {
  id: string;
  sub: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "user";
  createdAt: string;
}

export const fetchMe = () => api<Me>("/users/me");
