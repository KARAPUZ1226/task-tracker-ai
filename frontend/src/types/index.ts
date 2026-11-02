export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'todo' | 'in_progress' | 'done';

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  priority: Priority;
  status: Status;
  deadline?: string | null;
  tags?: string[];
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
}

export interface TaskCreatePayload {
  title: string;
  description?: string;
  priority: Priority;
  status?: Status;
  deadline?: string;
  tags?: string[];
  is_pinned?: boolean;
  subtasks?: string[];
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string | null;
  priority?: Priority;
  status?: Status;
  deadline?: string | null;
  tags?: string[];
  is_pinned?: boolean;
  subtasks?: string[];
}

export interface TaskStats {
  total_tasks: number;
  todo_tasks: number;
  in_progress_tasks: number;
  done_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  total_subtasks: number;
  completed_subtasks: number;
}

export interface AIDecomposeResponse {
  subtasks: string[];
  suggested_priority?: Priority;
  summary?: string;
  is_fallback: boolean;
}

export interface AIDescriptionResponse {
  description: string;
  is_fallback: boolean;
}

export interface AIDeadlineResponse {
  suggested_deadline: string;
  estimated_days: number;
  reasoning: string;
  is_fallback: boolean;
}

export interface AIPrioritizeResponse {
  suggested_priority: Priority;
  reasoning: string;
  is_fallback: boolean;
}

export interface AISmartAssistResponse {
  description: string;
  subtasks: string[];
  suggested_priority: Priority;
  suggested_deadline?: string | null;
  suggested_tags: string[];
  reasoning: string;
  is_fallback: boolean;
}
