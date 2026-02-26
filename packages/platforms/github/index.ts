/**
 * BlackRoad Platform Integration - GitHub
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * GitHub platform integration for:
 * - Repository management
 * - Issues and Pull Requests
 * - Actions workflows
 * - Releases and packages
 * - Organization management
 */

import { createPlatformConfig, SafeHttpClient, PlatformConfig } from '../core';

export interface GitHubUser {
  id: number;
  login: string;
  name?: string;
  email?: string;
  avatarUrl: string;
  type: 'User' | 'Organization' | 'Bot';
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description?: string;
  private: boolean;
  fork: boolean;
  defaultBranch: string;
  language?: string;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  license?: { key: string; name: string };
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  labels: Array<{ name: string; color: string }>;
  assignees: GitHubUser[];
  milestone?: { title: string; number: number };
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  user: GitHubUser;
}

export interface GitHubPullRequest extends GitHubIssue {
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  merged: boolean;
  mergedAt?: string;
  mergeable?: boolean;
  draft: boolean;
}

export interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

export interface GitHubWorkflowRun {
  id: number;
  workflowId: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped';
  headBranch: string;
  headSha: string;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

export interface GitHubRelease {
  id: number;
  tagName: string;
  name: string;
  body?: string;
  draft: boolean;
  prerelease: boolean;
  createdAt: string;
  publishedAt: string;
  assets: Array<{
    id: number;
    name: string;
    size: number;
    downloadCount: number;
    browserDownloadUrl: string;
  }>;
}

/**
 * GitHub Platform Client
 *
 * Environment Variables Required:
 * - GITHUB_ACCESS_TOKEN: Your GitHub personal access token or OAuth token
 * - GITHUB_ENABLED: Set to 'true' to enable
 */
export class GitHubClient {
  private config: PlatformConfig;
  private http: SafeHttpClient;

  constructor() {
    this.config = createPlatformConfig(
      'GitHub',
      'https://api.github.com',
      'GITHUB',
      { version: '2022-11-28', rateLimitPerMinute: 5000 }
    );
    this.http = new SafeHttpClient(this.config);
  }

  /**
   * Convert snake_case to camelCase for responses
   */
  private toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = value;
    }
    return result;
  }

  // =====================
  // User/Auth
  // =====================

  async getCurrentUser(): Promise<GitHubUser> {
    const response = await this.http.get<Record<string, unknown>>('/user');
    return this.toCamelCase(response.data) as unknown as GitHubUser;
  }

  async getUser(username: string): Promise<GitHubUser> {
    const response = await this.http.get<Record<string, unknown>>(`/users/${username}`);
    return this.toCamelCase(response.data) as unknown as GitHubUser;
  }

  // =====================
  // Repositories
  // =====================

  async listUserRepos(options?: {
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    perPage?: number;
  }): Promise<GitHubRepository[]> {
    const response = await this.http.get<Array<Record<string, unknown>>>('/user/repos', {
      type: options?.type || 'owner',
      sort: options?.sort || 'updated',
      per_page: String(options?.perPage || 30),
    });
    return response.data.map(r => this.toCamelCase(r) as unknown as GitHubRepository);
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepository> {
    const response = await this.http.get<Record<string, unknown>>(`/repos/${owner}/${repo}`);
    return this.toCamelCase(response.data) as unknown as GitHubRepository;
  }

  async createRepo(options: {
    name: string;
    description?: string;
    private?: boolean;
    autoInit?: boolean;
    gitignoreTemplate?: string;
    licenseTemplate?: string;
  }): Promise<GitHubRepository> {
    const response = await this.http.post<Record<string, unknown>>('/user/repos', {
      name: options.name,
      description: options.description,
      private: options.private || false,
      auto_init: options.autoInit,
      gitignore_template: options.gitignoreTemplate,
      license_template: options.licenseTemplate,
    });
    return this.toCamelCase(response.data) as unknown as GitHubRepository;
  }

  async forkRepo(owner: string, repo: string, organization?: string): Promise<GitHubRepository> {
    const response = await this.http.post<Record<string, unknown>>(`/repos/${owner}/${repo}/forks`, {
      organization,
    });
    return this.toCamelCase(response.data) as unknown as GitHubRepository;
  }

  async deleteRepo(owner: string, repo: string): Promise<void> {
    await this.http.delete(`/repos/${owner}/${repo}`);
  }

  // =====================
  // Issues
  // =====================

  async listIssues(
    owner: string,
    repo: string,
    options?: {
      state?: 'open' | 'closed' | 'all';
      labels?: string;
      perPage?: number;
    }
  ): Promise<GitHubIssue[]> {
    const response = await this.http.get<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/issues`,
      {
        state: options?.state || 'open',
        labels: options?.labels || '',
        per_page: String(options?.perPage || 30),
      }
    );
    return response.data.map(i => this.toCamelCase(i) as unknown as GitHubIssue);
  }

  async createIssue(
    owner: string,
    repo: string,
    options: {
      title: string;
      body?: string;
      labels?: string[];
      assignees?: string[];
      milestone?: number;
    }
  ): Promise<GitHubIssue> {
    const response = await this.http.post<Record<string, unknown>>(
      `/repos/${owner}/${repo}/issues`,
      options
    );
    return this.toCamelCase(response.data) as unknown as GitHubIssue;
  }

  async updateIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    options: Partial<{ title: string; body: string; state: 'open' | 'closed'; labels: string[] }>
  ): Promise<GitHubIssue> {
    const response = await this.http.patch<Record<string, unknown>>(
      `/repos/${owner}/${repo}/issues/${issueNumber}`,
      options
    );
    return this.toCamelCase(response.data) as unknown as GitHubIssue;
  }

  // =====================
  // Pull Requests
  // =====================

  async listPullRequests(
    owner: string,
    repo: string,
    options?: {
      state?: 'open' | 'closed' | 'all';
      head?: string;
      base?: string;
      perPage?: number;
    }
  ): Promise<GitHubPullRequest[]> {
    const response = await this.http.get<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/pulls`,
      {
        state: options?.state || 'open',
        per_page: String(options?.perPage || 30),
      }
    );
    return response.data.map(p => this.toCamelCase(p) as unknown as GitHubPullRequest);
  }

  async createPullRequest(
    owner: string,
    repo: string,
    options: {
      title: string;
      head: string;
      base: string;
      body?: string;
      draft?: boolean;
    }
  ): Promise<GitHubPullRequest> {
    const response = await this.http.post<Record<string, unknown>>(
      `/repos/${owner}/${repo}/pulls`,
      options
    );
    return this.toCamelCase(response.data) as unknown as GitHubPullRequest;
  }

  async mergePullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    options?: {
      commitTitle?: string;
      commitMessage?: string;
      mergeMethod?: 'merge' | 'squash' | 'rebase';
    }
  ): Promise<{ sha: string; merged: boolean; message: string }> {
    const response = await this.http.put<{ sha: string; merged: boolean; message: string }>(
      `/repos/${owner}/${repo}/pulls/${pullNumber}/merge`,
      {
        commit_title: options?.commitTitle,
        commit_message: options?.commitMessage,
        merge_method: options?.mergeMethod || 'merge',
      }
    );
    return response.data;
  }

  // =====================
  // Actions Workflows
  // =====================

  async listWorkflows(owner: string, repo: string): Promise<GitHubWorkflow[]> {
    const response = await this.http.get<{ workflows: Array<Record<string, unknown>> }>(
      `/repos/${owner}/${repo}/actions/workflows`
    );
    return response.data.workflows.map(w => this.toCamelCase(w) as unknown as GitHubWorkflow);
  }

  async listWorkflowRuns(
    owner: string,
    repo: string,
    workflowId?: number,
    options?: { branch?: string; status?: string; perPage?: number }
  ): Promise<GitHubWorkflowRun[]> {
    const path = workflowId
      ? `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`
      : `/repos/${owner}/${repo}/actions/runs`;

    const response = await this.http.get<{ workflow_runs: Array<Record<string, unknown>> }>(path, {
      branch: options?.branch || '',
      status: options?.status || '',
      per_page: String(options?.perPage || 30),
    });
    return response.data.workflow_runs.map(r => this.toCamelCase(r) as unknown as GitHubWorkflowRun);
  }

  async triggerWorkflow(
    owner: string,
    repo: string,
    workflowId: number | string,
    ref: string,
    inputs?: Record<string, string>
  ): Promise<void> {
    await this.http.post(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
      ref,
      inputs,
    });
  }

  // =====================
  // Releases
  // =====================

  async listReleases(owner: string, repo: string, perPage?: number): Promise<GitHubRelease[]> {
    const response = await this.http.get<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/releases`,
      { per_page: String(perPage || 30) }
    );
    return response.data.map(r => this.toCamelCase(r) as unknown as GitHubRelease);
  }

  async createRelease(
    owner: string,
    repo: string,
    options: {
      tagName: string;
      name?: string;
      body?: string;
      draft?: boolean;
      prerelease?: boolean;
      targetCommitish?: string;
    }
  ): Promise<GitHubRelease> {
    const response = await this.http.post<Record<string, unknown>>(
      `/repos/${owner}/${repo}/releases`,
      {
        tag_name: options.tagName,
        name: options.name,
        body: options.body,
        draft: options.draft,
        prerelease: options.prerelease,
        target_commitish: options.targetCommitish,
      }
    );
    return this.toCamelCase(response.data) as unknown as GitHubRelease;
  }
}

export default GitHubClient;
