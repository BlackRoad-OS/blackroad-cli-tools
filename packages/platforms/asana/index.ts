/**
 * BlackRoad Platform Integration - Asana
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Asana project management integration for:
 * - Task management
 * - Project tracking
 * - Workspace management
 * - Team collaboration
 * - Webhook handling
 */

import { createPlatformConfig, SafeHttpClient, PlatformConfig } from '../core';

export interface AsanaUser {
  gid: string;
  name: string;
  email?: string;
  photo?: {
    image_21x21: string;
    image_27x27: string;
    image_36x36: string;
    image_60x60: string;
    image_128x128: string;
  };
  workspaces?: AsanaWorkspace[];
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
  isOrganization: boolean;
}

export interface AsanaProject {
  gid: string;
  name: string;
  notes?: string;
  color?: string;
  workspace: AsanaWorkspace;
  team?: { gid: string; name: string };
  owner?: AsanaUser;
  currentStatus?: {
    color: 'green' | 'yellow' | 'red';
    text: string;
    author: AsanaUser;
    createdAt: string;
  };
  dueOn?: string;
  startOn?: string;
  public: boolean;
  archived: boolean;
  createdAt: string;
  modifiedAt: string;
}

export interface AsanaTask {
  gid: string;
  name: string;
  notes?: string;
  htmlNotes?: string;
  completed: boolean;
  completedAt?: string;
  assignee?: AsanaUser;
  assigneeStatus?: 'inbox' | 'today' | 'upcoming' | 'later';
  dueOn?: string;
  dueAt?: string;
  startOn?: string;
  startAt?: string;
  projects?: AsanaProject[];
  parent?: AsanaTask;
  tags?: AsanaTag[];
  workspace: AsanaWorkspace;
  customFields?: AsanaCustomField[];
  numSubtasks: number;
  createdAt: string;
  modifiedAt: string;
}

export interface AsanaTag {
  gid: string;
  name: string;
  color?: string;
  workspace: AsanaWorkspace;
}

export interface AsanaCustomField {
  gid: string;
  name: string;
  type: 'text' | 'number' | 'enum' | 'multi_enum' | 'date' | 'people';
  textValue?: string;
  numberValue?: number;
  enumValue?: { gid: string; name: string; color: string };
  multiEnumValues?: Array<{ gid: string; name: string; color: string }>;
  dateValue?: { date: string; dateTime?: string };
  peopleValue?: AsanaUser[];
}

export interface AsanaSection {
  gid: string;
  name: string;
  project: AsanaProject;
  createdAt: string;
}

export interface AsanaWebhook {
  gid: string;
  resource: { gid: string; name: string };
  target: string;
  active: boolean;
  createdAt: string;
  lastFailureAt?: string;
  lastFailureContent?: string;
}

/**
 * Asana Platform Client
 *
 * Environment Variables Required:
 * - ASANA_ACCESS_TOKEN: Personal access token or OAuth token
 * - ASANA_ENABLED: Set to 'true' to enable
 */
export class AsanaClient {
  private config: PlatformConfig;
  private http: SafeHttpClient;

  constructor() {
    this.config = createPlatformConfig(
      'Asana',
      'https://app.asana.com/api/1.0',
      'ASANA',
      { version: '1.0', rateLimitPerMinute: 150 }
    );
    this.http = new SafeHttpClient(this.config);
  }

  /**
   * Unwrap Asana API response
   */
  private unwrap<T>(response: { data: T }): T {
    return response.data;
  }

  // =====================
  // Users
  // =====================

  async getCurrentUser(): Promise<AsanaUser> {
    const response = await this.http.get<{ data: AsanaUser }>('/users/me');
    return this.unwrap(response.data);
  }

  async getUser(userId: string): Promise<AsanaUser> {
    const response = await this.http.get<{ data: AsanaUser }>(`/users/${userId}`);
    return this.unwrap(response.data);
  }

  async listUsersInWorkspace(workspaceId: string): Promise<AsanaUser[]> {
    const response = await this.http.get<{ data: AsanaUser[] }>(`/workspaces/${workspaceId}/users`);
    return this.unwrap(response.data);
  }

  // =====================
  // Workspaces
  // =====================

  async listWorkspaces(): Promise<AsanaWorkspace[]> {
    const response = await this.http.get<{ data: AsanaWorkspace[] }>('/workspaces');
    return this.unwrap(response.data);
  }

  async getWorkspace(workspaceId: string): Promise<AsanaWorkspace> {
    const response = await this.http.get<{ data: AsanaWorkspace }>(`/workspaces/${workspaceId}`);
    return this.unwrap(response.data);
  }

  // =====================
  // Projects
  // =====================

  async listProjects(workspaceId?: string, options?: { archived?: boolean; teamId?: string }): Promise<AsanaProject[]> {
    const query: Record<string, string> = {};

    if (workspaceId) query.workspace = workspaceId;
    if (options?.archived !== undefined) query.archived = String(options.archived);
    if (options?.teamId) query.team = options.teamId;

    const response = await this.http.get<{ data: AsanaProject[] }>('/projects', query);
    return this.unwrap(response.data);
  }

  async getProject(projectId: string): Promise<AsanaProject> {
    const response = await this.http.get<{ data: AsanaProject }>(`/projects/${projectId}`);
    return this.unwrap(response.data);
  }

  async createProject(workspaceId: string, options: {
    name: string;
    notes?: string;
    color?: string;
    teamId?: string;
    dueOn?: string;
    startOn?: string;
    public?: boolean;
  }): Promise<AsanaProject> {
    const response = await this.http.post<{ data: AsanaProject }>('/projects', {
      data: {
        workspace: workspaceId,
        name: options.name,
        notes: options.notes,
        color: options.color,
        team: options.teamId,
        due_on: options.dueOn,
        start_on: options.startOn,
        public: options.public,
      },
    });
    return this.unwrap(response.data);
  }

  async updateProject(projectId: string, options: Partial<{
    name: string;
    notes: string;
    color: string;
    dueOn: string;
    startOn: string;
    archived: boolean;
    public: boolean;
  }>): Promise<AsanaProject> {
    const response = await this.http.put<{ data: AsanaProject }>(`/projects/${projectId}`, {
      data: {
        name: options.name,
        notes: options.notes,
        color: options.color,
        due_on: options.dueOn,
        start_on: options.startOn,
        archived: options.archived,
        public: options.public,
      },
    });
    return this.unwrap(response.data);
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.http.delete(`/projects/${projectId}`);
  }

  // =====================
  // Tasks
  // =====================

  async listTasks(projectId: string, options?: { completedSince?: string }): Promise<AsanaTask[]> {
    const query: Record<string, string> = { project: projectId };

    if (options?.completedSince) query.completed_since = options.completedSince;

    const response = await this.http.get<{ data: AsanaTask[] }>('/tasks', query);
    return this.unwrap(response.data);
  }

  async getTask(taskId: string): Promise<AsanaTask> {
    const response = await this.http.get<{ data: AsanaTask }>(`/tasks/${taskId}`);
    return this.unwrap(response.data);
  }

  async createTask(projectId: string, options: {
    name: string;
    notes?: string;
    assignee?: string;
    dueOn?: string;
    dueAt?: string;
    startOn?: string;
    tags?: string[];
    parentId?: string;
  }): Promise<AsanaTask> {
    const response = await this.http.post<{ data: AsanaTask }>('/tasks', {
      data: {
        projects: [projectId],
        name: options.name,
        notes: options.notes,
        assignee: options.assignee,
        due_on: options.dueOn,
        due_at: options.dueAt,
        start_on: options.startOn,
        tags: options.tags,
        parent: options.parentId,
      },
    });
    return this.unwrap(response.data);
  }

  async updateTask(taskId: string, options: Partial<{
    name: string;
    notes: string;
    assignee: string;
    completed: boolean;
    dueOn: string;
    dueAt: string;
    startOn: string;
  }>): Promise<AsanaTask> {
    const response = await this.http.put<{ data: AsanaTask }>(`/tasks/${taskId}`, {
      data: {
        name: options.name,
        notes: options.notes,
        assignee: options.assignee,
        completed: options.completed,
        due_on: options.dueOn,
        due_at: options.dueAt,
        start_on: options.startOn,
      },
    });
    return this.unwrap(response.data);
  }

  async completeTask(taskId: string): Promise<AsanaTask> {
    return this.updateTask(taskId, { completed: true });
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.http.delete(`/tasks/${taskId}`);
  }

  async addTaskToProject(taskId: string, projectId: string): Promise<void> {
    await this.http.post(`/tasks/${taskId}/addProject`, {
      data: { project: projectId },
    });
  }

  async removeTaskFromProject(taskId: string, projectId: string): Promise<void> {
    await this.http.post(`/tasks/${taskId}/removeProject`, {
      data: { project: projectId },
    });
  }

  // =====================
  // Sections
  // =====================

  async listSections(projectId: string): Promise<AsanaSection[]> {
    const response = await this.http.get<{ data: AsanaSection[] }>(`/projects/${projectId}/sections`);
    return this.unwrap(response.data);
  }

  async createSection(projectId: string, name: string): Promise<AsanaSection> {
    const response = await this.http.post<{ data: AsanaSection }>(`/projects/${projectId}/sections`, {
      data: { name },
    });
    return this.unwrap(response.data);
  }

  async moveTaskToSection(taskId: string, sectionId: string): Promise<void> {
    await this.http.post(`/sections/${sectionId}/addTask`, {
      data: { task: taskId },
    });
  }

  // =====================
  // Tags
  // =====================

  async listTags(workspaceId: string): Promise<AsanaTag[]> {
    const response = await this.http.get<{ data: AsanaTag[] }>(`/workspaces/${workspaceId}/tags`);
    return this.unwrap(response.data);
  }

  async createTag(workspaceId: string, name: string, color?: string): Promise<AsanaTag> {
    const response = await this.http.post<{ data: AsanaTag }>('/tags', {
      data: { workspace: workspaceId, name, color },
    });
    return this.unwrap(response.data);
  }

  async addTagToTask(taskId: string, tagId: string): Promise<void> {
    await this.http.post(`/tasks/${taskId}/addTag`, {
      data: { tag: tagId },
    });
  }

  // =====================
  // Webhooks
  // =====================

  async createWebhook(resourceId: string, targetUrl: string): Promise<AsanaWebhook> {
    const response = await this.http.post<{ data: AsanaWebhook }>('/webhooks', {
      data: {
        resource: resourceId,
        target: targetUrl,
      },
    });
    return this.unwrap(response.data);
  }

  async listWebhooks(workspaceId: string): Promise<AsanaWebhook[]> {
    const response = await this.http.get<{ data: AsanaWebhook[] }>('/webhooks', {
      workspace: workspaceId,
    });
    return this.unwrap(response.data);
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await this.http.delete(`/webhooks/${webhookId}`);
  }

  // =====================
  // Search
  // =====================

  async searchTasks(workspaceId: string, query: string, options?: {
    projectId?: string;
    assigneeId?: string;
    completed?: boolean;
  }): Promise<AsanaTask[]> {
    const params: Record<string, string> = {
      'text': query,
    };

    if (options?.projectId) params['projects.any'] = options.projectId;
    if (options?.assigneeId) params['assignee.any'] = options.assigneeId;
    if (options?.completed !== undefined) params['completed'] = String(options.completed);

    const response = await this.http.get<{ data: AsanaTask[] }>(
      `/workspaces/${workspaceId}/tasks/search`,
      params
    );
    return this.unwrap(response.data);
  }
}

export default AsanaClient;
