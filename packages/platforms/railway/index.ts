/**
 * BlackRoad Platform Integration - Railway
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Railway.app deployment platform integration.
 * Safe, auditable code for managing Railway projects and deployments.
 */

import { createPlatformConfig, SafeHttpClient, PlatformConfig } from '../core';

export interface RailwayProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  teamId?: string;
  environments: RailwayEnvironment[];
}

export interface RailwayEnvironment {
  id: string;
  name: string;
  projectId: string;
  isProduction: boolean;
}

export interface RailwayService {
  id: string;
  name: string;
  projectId: string;
  environmentId: string;
  source: {
    repo?: string;
    branch?: string;
    image?: string;
  };
}

export interface RailwayDeployment {
  id: string;
  serviceId: string;
  status: 'BUILDING' | 'DEPLOYING' | 'SUCCESS' | 'FAILED' | 'CRASHED' | 'REMOVED';
  createdAt: string;
  completedAt?: string;
}

export interface RailwayVariable {
  name: string;
  value: string;
  environmentId: string;
  serviceId?: string;
}

/**
 * Railway Platform Client
 *
 * Environment Variables Required:
 * - RAILWAY_API_KEY: Your Railway API token
 * - RAILWAY_ENABLED: Set to 'true' to enable
 */
export class RailwayClient {
  private config: PlatformConfig;
  private http: SafeHttpClient;

  constructor() {
    this.config = createPlatformConfig(
      'Railway',
      'https://backboard.railway.app/graphql/v2',
      'RAILWAY',
      { version: 'v2', rateLimitPerMinute: 100 }
    );
    this.http = new SafeHttpClient(this.config);
  }

  /**
   * Execute GraphQL query
   */
  private async graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await this.http.post<{ data: T; errors?: Array<{ message: string }> }>('', {
      query,
      variables,
    });

    if (response.data.errors?.length) {
      throw new Error(`Railway API Error: ${response.data.errors[0].message}`);
    }

    return response.data.data;
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<RailwayProject[]> {
    const query = `
      query {
        me {
          projects {
            edges {
              node {
                id
                name
                description
                createdAt
                updatedAt
                teamId
                environments {
                  edges {
                    node {
                      id
                      name
                      isEphemeral
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    interface Response {
      me: {
        projects: {
          edges: Array<{
            node: {
              id: string;
              name: string;
              description?: string;
              createdAt: string;
              updatedAt: string;
              teamId?: string;
              environments: {
                edges: Array<{
                  node: {
                    id: string;
                    name: string;
                    isEphemeral: boolean;
                  };
                }>;
              };
            };
          }>;
        };
      };
    }

    const data = await this.graphql<Response>(query);
    return data.me.projects.edges.map(edge => ({
      ...edge.node,
      environments: edge.node.environments.edges.map(e => ({
        id: e.node.id,
        name: e.node.name,
        projectId: edge.node.id,
        isProduction: !e.node.isEphemeral,
      })),
    }));
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<RailwayProject | null> {
    const query = `
      query ($id: String!) {
        project(id: $id) {
          id
          name
          description
          createdAt
          updatedAt
          teamId
          environments {
            edges {
              node {
                id
                name
                isEphemeral
              }
            }
          }
        }
      }
    `;

    interface Response {
      project: {
        id: string;
        name: string;
        description?: string;
        createdAt: string;
        updatedAt: string;
        teamId?: string;
        environments: {
          edges: Array<{
            node: {
              id: string;
              name: string;
              isEphemeral: boolean;
            };
          }>;
        };
      } | null;
    }

    const data = await this.graphql<Response>(query, { id: projectId });
    if (!data.project) return null;

    return {
      ...data.project,
      environments: data.project.environments.edges.map(e => ({
        id: e.node.id,
        name: e.node.name,
        projectId: data.project!.id,
        isProduction: !e.node.isEphemeral,
      })),
    };
  }

  /**
   * List services in a project
   */
  async listServices(projectId: string): Promise<RailwayService[]> {
    const query = `
      query ($projectId: String!) {
        project(id: $projectId) {
          services {
            edges {
              node {
                id
                name
                projectId
              }
            }
          }
        }
      }
    `;

    interface Response {
      project: {
        services: {
          edges: Array<{
            node: {
              id: string;
              name: string;
              projectId: string;
            };
          }>;
        };
      };
    }

    const data = await this.graphql<Response>(query, { projectId });
    return data.project.services.edges.map(edge => ({
      ...edge.node,
      environmentId: '',
      source: {},
    }));
  }

  /**
   * Trigger a deployment
   */
  async deploy(serviceId: string, environmentId: string): Promise<RailwayDeployment> {
    const mutation = `
      mutation ($serviceId: String!, $environmentId: String!) {
        serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
      }
    `;

    await this.graphql(mutation, { serviceId, environmentId });

    return {
      id: `deploy-${Date.now()}`,
      serviceId,
      status: 'BUILDING',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<RailwayDeployment> {
    const query = `
      query ($id: String!) {
        deployment(id: $id) {
          id
          status
          createdAt
        }
      }
    `;

    interface Response {
      deployment: {
        id: string;
        status: RailwayDeployment['status'];
        createdAt: string;
      };
    }

    const data = await this.graphql<Response>(query, { id: deploymentId });
    return {
      ...data.deployment,
      serviceId: '',
    };
  }

  /**
   * Set environment variable
   */
  async setVariable(
    projectId: string,
    environmentId: string,
    name: string,
    value: string
  ): Promise<void> {
    const mutation = `
      mutation ($input: VariableUpsertInput!) {
        variableUpsert(input: $input)
      }
    `;

    await this.graphql(mutation, {
      input: {
        projectId,
        environmentId,
        name,
        value,
      },
    });
  }

  /**
   * Get logs for a deployment
   */
  async getLogs(
    deploymentId: string,
    options?: { limit?: number; startDate?: string }
  ): Promise<string[]> {
    const query = `
      query ($deploymentId: String!, $limit: Int) {
        deploymentLogs(deploymentId: $deploymentId, limit: $limit) {
          message
          timestamp
        }
      }
    `;

    interface Response {
      deploymentLogs: Array<{
        message: string;
        timestamp: string;
      }>;
    }

    const data = await this.graphql<Response>(query, {
      deploymentId,
      limit: options?.limit || 100,
    });

    return data.deploymentLogs.map(log => `[${log.timestamp}] ${log.message}`);
  }
}

export default RailwayClient;
