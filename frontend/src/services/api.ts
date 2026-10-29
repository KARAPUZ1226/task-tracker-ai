import {
  AuthResponse,
  User,
  Task,
  TaskCreatePayload,
  TaskUpdatePayload,
  Subtask,
  AIDecomposeResponse,
  AIDescriptionResponse,
  AIDeadlineResponse,
  AIPrioritizeResponse,
  Priority,
  Status
} from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) {
    return {} as T;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.detail || `Ошибка запроса (${response.status})`;
    throw new ApiError(errorMsg, response.status);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string):Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me');
  },

  // Tasks
  async getTasks(params?: { search?: string; status?: Status; priority?: Priority }): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<Task[]>(`/tasks${qs}`);
  },

  async createTask(payload: TaskCreatePayload): Promise<Task> {
    return request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getTask(id: number): Promise<Task> {
    return request<Task>(`/tasks/${id}`);
  },

  async updateTask(id: number, payload: TaskUpdatePayload): Promise<Task> {
    return request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteTask(id: number): Promise<void> {
    return request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  // Subtasks
  async createSubtask(taskId: number, title: string): Promise<Subtask> {
    return request<Subtask>(`/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  async updateSubtask(taskId: number, subtaskId: number, payload: { title?: string; is_completed?: boolean }): Promise<Subtask> {
    return request<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteSubtask(taskId: number, subtaskId: number): Promise<void> {
    return request<void>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'DELETE',
    });
  },

  // AI features
  async aiDecompose(title: string, description?: string, apiKey?: string): Promise<AIDecomposeResponse> {
    return request<AIDecomposeResponse>('/ai/decompose', {
      method: 'POST',
      body: JSON.stringify({ title, description, api_key: apiKey || undefined }),
    });
  },

  async aiGenerateDescription(title: string, context?: string, apiKey?: string): Promise<AIDescriptionResponse> {
    return request<AIDescriptionResponse>('/ai/generate-description', {
      method: 'POST',
      body: JSON.stringify({ title, context, api_key: apiKey || undefined }),
    });
  },

  async aiSuggestDeadline(title: string, description?: string, priority?: Priority, apiKey?: string): Promise<AIDeadlineResponse> {
    return request<AIDeadlineResponse>('/ai/suggest-deadline', {
      method: 'POST',
      body: JSON.stringify({ title, description, priority, api_key: apiKey || undefined }),
    });
  },

  async aiPrioritize(title: string, description?: string, apiKey?: string): Promise<AIPrioritizeResponse> {
    return request<AIPrioritizeResponse>('/ai/prioritize', {
      method: 'POST',
      body: JSON.stringify({ title, description, api_key: apiKey || undefined }),
    });
  },
};
