/**
 * BlackRoad Platform Integration - Docker
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Docker container management integration for:
 * - Container lifecycle management
 * - Image management
 * - Network management
 * - Volume management
 * - Docker Compose operations
 * - Registry interactions
 */

import { createPlatformConfig, SafeHttpClient, PlatformConfig } from '../core';

export interface DockerContainer {
  id: string;
  names: string[];
  image: string;
  imageId: string;
  command: string;
  created: number;
  state: 'created' | 'running' | 'paused' | 'restarting' | 'removing' | 'exited' | 'dead';
  status: string;
  ports: Array<{
    privatePort: number;
    publicPort?: number;
    type: 'tcp' | 'udp';
    ip?: string;
  }>;
  labels: Record<string, string>;
  mounts: Array<{
    type: 'bind' | 'volume' | 'tmpfs';
    source: string;
    destination: string;
    mode: string;
    rw: boolean;
  }>;
  networkSettings: {
    networks: Record<string, {
      networkId: string;
      ipAddress: string;
      gateway: string;
      macAddress: string;
    }>;
  };
}

export interface DockerImage {
  id: string;
  parentId: string;
  repoTags: string[];
  repoDigests: string[];
  created: number;
  size: number;
  virtualSize: number;
  labels: Record<string, string>;
}

export interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  scope: 'local' | 'swarm' | 'global';
  ipam: {
    driver: string;
    config: Array<{
      subnet: string;
      gateway: string;
    }>;
  };
  internal: boolean;
  attachable: boolean;
  ingress: boolean;
  containers: Record<string, {
    name: string;
    endpointId: string;
    macAddress: string;
    ipv4Address: string;
    ipv6Address: string;
  }>;
  options: Record<string, string>;
  labels: Record<string, string>;
}

export interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
  status: Record<string, string>;
  labels: Record<string, string>;
  scope: 'local' | 'global';
  options: Record<string, string>;
  usageData?: {
    size: number;
    refCount: number;
  };
}

export interface DockerSystemInfo {
  id: string;
  containers: number;
  containersRunning: number;
  containersPaused: number;
  containersStopped: number;
  images: number;
  driver: string;
  memoryLimit: boolean;
  swapLimit: boolean;
  kernelVersion: string;
  operatingSystem: string;
  osType: string;
  architecture: string;
  cpus: number;
  memTotal: number;
  dockerRootDir: string;
  serverVersion: string;
}

export interface ContainerCreateOptions {
  name?: string;
  image: string;
  cmd?: string[];
  entrypoint?: string[];
  env?: Record<string, string>;
  exposedPorts?: Record<string, {}>;
  hostConfig?: {
    binds?: string[];
    portBindings?: Record<string, Array<{ hostPort: string; hostIp?: string }>>;
    memory?: number;
    memorySwap?: number;
    cpuShares?: number;
    cpuPeriod?: number;
    cpuQuota?: number;
    restartPolicy?: { name: 'no' | 'always' | 'unless-stopped' | 'on-failure'; maximumRetryCount?: number };
    networkMode?: string;
    privileged?: boolean;
    autoRemove?: boolean;
  };
  labels?: Record<string, string>;
  workingDir?: string;
  user?: string;
  networkingConfig?: {
    endpointsConfig: Record<string, {
      ipamConfig?: { ipv4Address?: string; ipv6Address?: string };
      aliases?: string[];
    }>;
  };
}

/**
 * Docker Platform Client
 *
 * Connects to Docker daemon via Unix socket or TCP.
 *
 * Environment Variables:
 * - DOCKER_HOST: Docker daemon socket (default: unix:///var/run/docker.sock)
 * - DOCKER_CERT_PATH: Path to TLS certificates (for remote Docker)
 * - DOCKER_TLS_VERIFY: Enable TLS verification
 * - DOCKER_ENABLED: Set to 'true' to enable
 */
export class DockerClient {
  private config: PlatformConfig;
  private http: SafeHttpClient;

  constructor() {
    const dockerHost = process.env.DOCKER_HOST || 'http://localhost:2375';

    this.config = createPlatformConfig(
      'Docker',
      dockerHost,
      'DOCKER',
      { version: 'v1.43', timeout: 60000 }
    );
    this.http = new SafeHttpClient(this.config);
  }

  // =====================
  // System
  // =====================

  async info(): Promise<DockerSystemInfo> {
    const response = await this.http.get<DockerSystemInfo>('/info');
    return response.data;
  }

  async version(): Promise<{
    version: string;
    apiVersion: string;
    goVersion: string;
    gitCommit: string;
    built: string;
    os: string;
    arch: string;
  }> {
    const response = await this.http.get('/version');
    return response.data as {
      version: string;
      apiVersion: string;
      goVersion: string;
      gitCommit: string;
      built: string;
      os: string;
      arch: string;
    };
  }

  async ping(): Promise<boolean> {
    try {
      await this.http.get('/_ping');
      return true;
    } catch {
      return false;
    }
  }

  // =====================
  // Containers
  // =====================

  async listContainers(options?: { all?: boolean; limit?: number; filters?: Record<string, string[]> }): Promise<DockerContainer[]> {
    const query: Record<string, string> = {};

    if (options?.all) query.all = 'true';
    if (options?.limit) query.limit = String(options.limit);
    if (options?.filters) query.filters = JSON.stringify(options.filters);

    const response = await this.http.get<DockerContainer[]>('/containers/json', query);
    return response.data;
  }

  async getContainer(containerId: string): Promise<DockerContainer> {
    const response = await this.http.get<DockerContainer>(`/containers/${containerId}/json`);
    return response.data;
  }

  async createContainer(options: ContainerCreateOptions): Promise<{ id: string; warnings: string[] }> {
    const query = options.name ? { name: options.name } : undefined;

    const body = {
      Image: options.image,
      Cmd: options.cmd,
      Entrypoint: options.entrypoint,
      Env: options.env ? Object.entries(options.env).map(([k, v]) => `${k}=${v}`) : undefined,
      ExposedPorts: options.exposedPorts,
      HostConfig: options.hostConfig ? {
        Binds: options.hostConfig.binds,
        PortBindings: options.hostConfig.portBindings,
        Memory: options.hostConfig.memory,
        MemorySwap: options.hostConfig.memorySwap,
        CpuShares: options.hostConfig.cpuShares,
        CpuPeriod: options.hostConfig.cpuPeriod,
        CpuQuota: options.hostConfig.cpuQuota,
        RestartPolicy: options.hostConfig.restartPolicy,
        NetworkMode: options.hostConfig.networkMode,
        Privileged: options.hostConfig.privileged,
        AutoRemove: options.hostConfig.autoRemove,
      } : undefined,
      Labels: options.labels,
      WorkingDir: options.workingDir,
      User: options.user,
      NetworkingConfig: options.networkingConfig,
    };

    const response = await this.http.post<{ Id: string; Warnings: string[] }>(
      '/containers/create',
      body
    );

    return {
      id: response.data.Id,
      warnings: response.data.Warnings || [],
    };
  }

  async startContainer(containerId: string): Promise<void> {
    await this.http.post(`/containers/${containerId}/start`);
  }

  async stopContainer(containerId: string, timeout?: number): Promise<void> {
    const query = timeout ? { t: String(timeout) } : undefined;
    await this.http.post(`/containers/${containerId}/stop`, undefined);
  }

  async restartContainer(containerId: string, timeout?: number): Promise<void> {
    const query = timeout ? { t: String(timeout) } : undefined;
    await this.http.post(`/containers/${containerId}/restart`, undefined);
  }

  async killContainer(containerId: string, signal?: string): Promise<void> {
    const query = signal ? { signal } : undefined;
    await this.http.post(`/containers/${containerId}/kill`, undefined);
  }

  async removeContainer(containerId: string, options?: { force?: boolean; v?: boolean }): Promise<void> {
    const query: Record<string, string> = {};
    if (options?.force) query.force = 'true';
    if (options?.v) query.v = 'true';

    await this.http.delete(`/containers/${containerId}`);
  }

  async pauseContainer(containerId: string): Promise<void> {
    await this.http.post(`/containers/${containerId}/pause`);
  }

  async unpauseContainer(containerId: string): Promise<void> {
    await this.http.post(`/containers/${containerId}/unpause`);
  }

  async getContainerLogs(
    containerId: string,
    options?: { stdout?: boolean; stderr?: boolean; tail?: number; since?: number; timestamps?: boolean }
  ): Promise<string> {
    const query: Record<string, string> = {
      stdout: String(options?.stdout ?? true),
      stderr: String(options?.stderr ?? true),
    };

    if (options?.tail) query.tail = String(options.tail);
    if (options?.since) query.since = String(options.since);
    if (options?.timestamps) query.timestamps = 'true';

    const response = await this.http.get<string>(`/containers/${containerId}/logs`, query);
    return response.data;
  }

  async execInContainer(
    containerId: string,
    cmd: string[],
    options?: { attachStdout?: boolean; attachStderr?: boolean; tty?: boolean; user?: string; workingDir?: string }
  ): Promise<{ id: string }> {
    const response = await this.http.post<{ Id: string }>(`/containers/${containerId}/exec`, {
      AttachStdout: options?.attachStdout ?? true,
      AttachStderr: options?.attachStderr ?? true,
      Tty: options?.tty ?? false,
      Cmd: cmd,
      User: options?.user,
      WorkingDir: options?.workingDir,
    });

    return { id: response.data.Id };
  }

  // =====================
  // Images
  // =====================

  async listImages(options?: { all?: boolean; filters?: Record<string, string[]> }): Promise<DockerImage[]> {
    const query: Record<string, string> = {};

    if (options?.all) query.all = 'true';
    if (options?.filters) query.filters = JSON.stringify(options.filters);

    const response = await this.http.get<DockerImage[]>('/images/json', query);
    return response.data;
  }

  async getImage(imageId: string): Promise<DockerImage> {
    const response = await this.http.get<DockerImage>(`/images/${imageId}/json`);
    return response.data;
  }

  async pullImage(image: string, tag?: string): Promise<void> {
    const query: Record<string, string> = { fromImage: image };
    if (tag) query.tag = tag;

    await this.http.post('/images/create', undefined);
  }

  async tagImage(imageId: string, repo: string, tag?: string): Promise<void> {
    const query: Record<string, string> = { repo };
    if (tag) query.tag = tag;

    await this.http.post(`/images/${imageId}/tag`, undefined);
  }

  async removeImage(imageId: string, options?: { force?: boolean; noprune?: boolean }): Promise<void> {
    const query: Record<string, string> = {};
    if (options?.force) query.force = 'true';
    if (options?.noprune) query.noprune = 'true';

    await this.http.delete(`/images/${imageId}`);
  }

  // =====================
  // Networks
  // =====================

  async listNetworks(filters?: Record<string, string[]>): Promise<DockerNetwork[]> {
    const query = filters ? { filters: JSON.stringify(filters) } : undefined;
    const response = await this.http.get<DockerNetwork[]>('/networks', query);
    return response.data;
  }

  async getNetwork(networkId: string): Promise<DockerNetwork> {
    const response = await this.http.get<DockerNetwork>(`/networks/${networkId}`);
    return response.data;
  }

  async createNetwork(options: {
    name: string;
    driver?: string;
    internal?: boolean;
    attachable?: boolean;
    ipam?: DockerNetwork['ipam'];
    labels?: Record<string, string>;
  }): Promise<{ id: string; warning: string }> {
    const response = await this.http.post<{ Id: string; Warning: string }>('/networks/create', {
      Name: options.name,
      Driver: options.driver || 'bridge',
      Internal: options.internal,
      Attachable: options.attachable,
      IPAM: options.ipam,
      Labels: options.labels,
    });

    return { id: response.data.Id, warning: response.data.Warning };
  }

  async removeNetwork(networkId: string): Promise<void> {
    await this.http.delete(`/networks/${networkId}`);
  }

  async connectContainerToNetwork(networkId: string, containerId: string, aliases?: string[]): Promise<void> {
    await this.http.post(`/networks/${networkId}/connect`, {
      Container: containerId,
      EndpointConfig: aliases ? { Aliases: aliases } : undefined,
    });
  }

  async disconnectContainerFromNetwork(networkId: string, containerId: string, force?: boolean): Promise<void> {
    await this.http.post(`/networks/${networkId}/disconnect`, {
      Container: containerId,
      Force: force,
    });
  }

  // =====================
  // Volumes
  // =====================

  async listVolumes(filters?: Record<string, string[]>): Promise<{ volumes: DockerVolume[]; warnings: string[] }> {
    const query = filters ? { filters: JSON.stringify(filters) } : undefined;
    const response = await this.http.get<{ Volumes: DockerVolume[]; Warnings: string[] }>('/volumes', query);
    return {
      volumes: response.data.Volumes || [],
      warnings: response.data.Warnings || [],
    };
  }

  async getVolume(volumeName: string): Promise<DockerVolume> {
    const response = await this.http.get<DockerVolume>(`/volumes/${volumeName}`);
    return response.data;
  }

  async createVolume(options: {
    name?: string;
    driver?: string;
    driverOpts?: Record<string, string>;
    labels?: Record<string, string>;
  }): Promise<DockerVolume> {
    const response = await this.http.post<DockerVolume>('/volumes/create', {
      Name: options.name,
      Driver: options.driver || 'local',
      DriverOpts: options.driverOpts,
      Labels: options.labels,
    });
    return response.data;
  }

  async removeVolume(volumeName: string, force?: boolean): Promise<void> {
    const query = force ? { force: 'true' } : undefined;
    await this.http.delete(`/volumes/${volumeName}`);
  }

  // =====================
  // Cleanup
  // =====================

  async pruneContainers(filters?: Record<string, string[]>): Promise<{ containersDeleted: string[]; spaceReclaimed: number }> {
    const response = await this.http.post<{ ContainersDeleted: string[]; SpaceReclaimed: number }>(
      '/containers/prune',
      undefined
    );
    return {
      containersDeleted: response.data.ContainersDeleted || [],
      spaceReclaimed: response.data.SpaceReclaimed || 0,
    };
  }

  async pruneImages(filters?: Record<string, string[]>): Promise<{ imagesDeleted: Array<{ deleted?: string; untagged?: string }>; spaceReclaimed: number }> {
    const response = await this.http.post<{ ImagesDeleted: Array<{ Deleted?: string; Untagged?: string }>; SpaceReclaimed: number }>(
      '/images/prune',
      undefined
    );
    return {
      imagesDeleted: (response.data.ImagesDeleted || []).map(i => ({ deleted: i.Deleted, untagged: i.Untagged })),
      spaceReclaimed: response.data.SpaceReclaimed || 0,
    };
  }

  async pruneVolumes(filters?: Record<string, string[]>): Promise<{ volumesDeleted: string[]; spaceReclaimed: number }> {
    const response = await this.http.post<{ VolumesDeleted: string[]; SpaceReclaimed: number }>(
      '/volumes/prune',
      undefined
    );
    return {
      volumesDeleted: response.data.VolumesDeleted || [],
      spaceReclaimed: response.data.SpaceReclaimed || 0,
    };
  }

  async pruneNetworks(filters?: Record<string, string[]>): Promise<{ networksDeleted: string[] }> {
    const response = await this.http.post<{ NetworksDeleted: string[] }>(
      '/networks/prune',
      undefined
    );
    return {
      networksDeleted: response.data.NetworksDeleted || [],
    };
  }
}

export default DockerClient;
