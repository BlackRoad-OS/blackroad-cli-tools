/**
 * BlackRoad Platform Integration - Vercel
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Vercel deployment platform integration for:
 * - Project management
 * - Deployments
 * - Environment variables
 * - Domains
 * - Edge functions
 * - Analytics
 */

import { createPlatformConfig, SafeHttpClient, PlatformConfig } from '../core';

export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  framework?: string;
  devCommand?: string;
  buildCommand?: string;
  outputDirectory?: string;
  rootDirectory?: string;
  nodeVersion?: string;
  publicSource?: boolean;
  createdAt: number;
  updatedAt: number;
  latestDeployments?: VercelDeployment[];
}

export interface VercelDeployment {
  id: string;
  uid: string;
  name: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  readyState: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED' | 'CANCELED';
  type: 'LAMBDAS';
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  creator: { uid: string; email: string; username: string };
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitRef?: string;
    githubRepo?: string;
    githubOrg?: string;
  };
  target?: 'production' | 'staging' | 'preview';
  aliasAssigned?: boolean;
  aliasError?: { code: string; message: string };
  inspectorUrl?: string;
}

export interface VercelDomain {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string;
  redirectStatusCode?: 301 | 302 | 307 | 308;
  gitBranch?: string;
  updatedAt: number;
  createdAt: number;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
}

export interface VercelEnvironmentVariable {
  id: string;
  key: string;
  value: string;
  type: 'system' | 'encrypted' | 'plain';
  target: Array<'production' | 'preview' | 'development'>;
  configurationId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface VercelTeam {
  id: string;
  slug: string;
  name: string;
  creatorId: string;
  createdAt: number;
  updatedAt: number;
}

export interface VercelLog {
  id: string;
  message: string;
  timestamp: number;
  type: 'stdout' | 'stderr';
  source: 'build' | 'lambda' | 'edge' | 'static';
  deploymentId: string;
  requestId?: string;
  statusCode?: number;
  path?: string;
}

/**
 * Vercel Platform Client
 *
 * Environment Variables Required:
 * - VERCEL_ACCESS_TOKEN: Your Vercel access token
 * - VERCEL_TEAM_ID: Optional team ID for team projects
 * - VERCEL_ENABLED: Set to 'true' to enable
 */
export class VercelClient {
  private config: PlatformConfig;
  private http: SafeHttpClient;
  private teamId?: string;

  constructor() {
    this.config = createPlatformConfig(
      'Vercel',
      'https://api.vercel.com',
      'VERCEL',
      { version: 'v9', rateLimitPerMinute: 60 }
    );
    this.http = new SafeHttpClient(this.config);
    this.teamId = process.env.VERCEL_TEAM_ID;
  }

  /**
   * Add team query parameter if team ID is set
   */
  private withTeam(query: Record<string, string> = {}): Record<string, string> {
    if (this.teamId) {
      return { ...query, teamId: this.teamId };
    }
    return query;
  }

  // =====================
  // Projects
  // =====================

  async listProjects(options?: { limit?: number; since?: number }): Promise<VercelProject[]> {
    const response = await this.http.get<{ projects: VercelProject[] }>(
      '/v9/projects',
      this.withTeam({
        limit: String(options?.limit || 20),
      })
    );
    return response.data.projects;
  }

  async getProject(projectId: string): Promise<VercelProject> {
    const response = await this.http.get<VercelProject>(
      `/v9/projects/${projectId}`,
      this.withTeam()
    );
    return response.data;
  }

  async createProject(options: {
    name: string;
    framework?: string;
    buildCommand?: string;
    devCommand?: string;
    outputDirectory?: string;
    rootDirectory?: string;
    gitRepository?: {
      type: 'github' | 'gitlab' | 'bitbucket';
      repo: string;
    };
  }): Promise<VercelProject> {
    const response = await this.http.post<VercelProject>(
      `/v9/projects${this.teamId ? `?teamId=${this.teamId}` : ''}`,
      options
    );
    return response.data;
  }

  async updateProject(
    projectId: string,
    options: Partial<Pick<VercelProject, 'name' | 'framework' | 'buildCommand' | 'devCommand' | 'outputDirectory' | 'rootDirectory'>>
  ): Promise<VercelProject> {
    const response = await this.http.patch<VercelProject>(
      `/v9/projects/${projectId}${this.teamId ? `?teamId=${this.teamId}` : ''}`,
      options
    );
    return response.data;
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.http.delete(`/v9/projects/${projectId}${this.teamId ? `?teamId=${this.teamId}` : ''}`);
  }

  // =====================
  // Deployments
  // =====================

  async listDeployments(
    projectId?: string,
    options?: { limit?: number; target?: 'production' | 'preview' }
  ): Promise<VercelDeployment[]> {
    const query = this.withTeam({
      limit: String(options?.limit || 20),
    });

    if (projectId) {
      query.projectId = projectId;
    }
    if (options?.target) {
      query.target = options.target;
    }

    const response = await this.http.get<{ deployments: VercelDeployment[] }>(
      '/v6/deployments',
      query
    );
    return response.data.deployments;
  }

  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    const response = await this.http.get<VercelDeployment>(
      `/v13/deployments/${deploymentId}`,
      this.withTeam()
    );
    return response.data;
  }

  async createDeployment(options: {
    name: string;
    project?: string;
    target?: 'production' | 'staging' | 'preview';
    gitSource?: {
      type: 'github' | 'gitlab' | 'bitbucket';
      ref: string;
      repoId: string | number;
    };
  }): Promise<VercelDeployment> {
    const response = await this.http.post<VercelDeployment>(
      `/v13/deployments${this.teamId ? `?teamId=${this.teamId}` : ''}`,
      options
    );
    return response.data;
  }

  async cancelDeployment(deploymentId: string): Promise<void> {
    await this.http.patch(
      `/v12/deployments/${deploymentId}/cancel${this.teamId ? `?teamId=${this.teamId}` : ''}`
    );
  }

  async redeployDeployment(deploymentId: string, target?: 'production' | 'preview'): Promise<VercelDeployment> {
    const response = await this.http.post<VercelDeployment>(
      `/v13/deployments${this.teamId ? `?teamId=${this.teamId}` : ''}`,
      {
        deploymentId,
        target,
      }
    );
    return response.data;
  }

  // =====================
  // Environment Variables
  // =====================

  async listEnvVars(projectId: string): Promise<VercelEnvironmentVariable[]> {
    const response = await this.http.get<{ envs: VercelEnvironmentVariable[] }>(
      `/v9/projects/${projectId}/env`,
      this.withTeam()
    );
    return response.data.envs;
  }

  async createEnvVar(
    projectId: string,
    options: {
      key: string;
      value: string;
      type?: 'plain' | 'encrypted';
      target: Array<'production' | 'preview' | 'development'>;
    }
  ): Promise<VercelEnvironmentVariable> {
    const response = await this.http.post<VercelEnvironmentVariable>(
      `/v9/projects/${projectId}/env${this.teamId ? `?teamId=${this.teamId}` : ''}`,
      options
    );
    return response.data;
  }

  async updateEnvVar(
    projectId: string,
    envId: string,
    options: Partial<{
      value: string;
      target: Array<'production' | 'preview' | 'development'>;
    }>
  ): Promise<VercelEnvironmentVariable> {
    const response = await this.http.patch<VercelEnvironmentVariable>(
      `/v9/projects/${projectId}/env/${envId}${this.teamId ? `?teamId=${this.teamId}` : ''}`,
      options
    );
    return response.data;
  }

  async deleteEnvVar(projectId: string, envId: string): Promise<void> {
    await this.http.delete(
      `/v9/projects/${projectId}/env/${envId}${this.teamId ? `?teamId=${this.teamId}` : ''}`
    );
  }

  // =====================
  // Domains
  // =====================

  async listDomains(projectId: string): Promise<VercelDomain[]> {
    const response = await this.http.get<{ domains: VercelDomain[] }>(
      `/v9/projects/${projectId}/domains`,
      this.withTeam()
    );
    return response.data.domains;
  }

  async addDomain(projectId: string, domain: string, gitBranch?: string): Promise<VercelDomain> {
    const response = await this.http.post<VercelDomain>(
      `/v9/projects/${projectId}/domains${this.teamId ? `?teamId=${this.teamId}` : ''}`,
      { name: domain, gitBranch }
    );
    return response.data;
  }

  async removeDomain(projectId: string, domain: string): Promise<void> {
    await this.http.delete(
      `/v9/projects/${projectId}/domains/${domain}${this.teamId ? `?teamId=${this.teamId}` : ''}`
    );
  }

  async verifyDomain(projectId: string, domain: string): Promise<VercelDomain> {
    const response = await this.http.post<VercelDomain>(
      `/v9/projects/${projectId}/domains/${domain}/verify${this.teamId ? `?teamId=${this.teamId}` : ''}`
    );
    return response.data;
  }

  // =====================
  // Logs
  // =====================

  async getDeploymentLogs(
    deploymentId: string,
    options?: {
      follow?: boolean;
      limit?: number;
      since?: number;
      until?: number;
    }
  ): Promise<VercelLog[]> {
    const query = this.withTeam({});

    if (options?.limit) query.limit = String(options.limit);
    if (options?.since) query.since = String(options.since);
    if (options?.until) query.until = String(options.until);

    const response = await this.http.get<{ logs: VercelLog[] }>(
      `/v2/deployments/${deploymentId}/events`,
      query
    );
    return response.data.logs || [];
  }

  // =====================
  // Teams
  // =====================

  async listTeams(): Promise<VercelTeam[]> {
    const response = await this.http.get<{ teams: VercelTeam[] }>('/v2/teams');
    return response.data.teams;
  }

  async getTeam(teamId: string): Promise<VercelTeam> {
    const response = await this.http.get<VercelTeam>(`/v2/teams/${teamId}`);
    return response.data;
  }

  // =====================
  // User
  // =====================

  async getCurrentUser(): Promise<{ id: string; email: string; name: string; username: string }> {
    const response = await this.http.get<{ user: { id: string; email: string; name: string; username: string } }>('/v2/user');
    return response.data.user;
  }
}

export default VercelClient;
