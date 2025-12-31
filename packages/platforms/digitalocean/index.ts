/**
 * BlackRoad Platform Integration - DigitalOcean
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * DigitalOcean platform integration for:
 * - Droplet management
 * - Kubernetes clusters
 * - App Platform
 * - Spaces (S3-compatible storage)
 * - Managed databases
 * - Load balancers
 * - Networking (VPCs, Firewalls)
 */

import { createPlatformConfig, SafeHttpClient, PlatformConfig } from '../core';

export interface DODroplet {
  id: number;
  name: string;
  status: 'new' | 'active' | 'off' | 'archive';
  memory: number;
  vcpus: number;
  disk: number;
  region: { slug: string; name: string };
  image: { id: number; name: string; slug?: string };
  size: { slug: string; memory: number; vcpus: number; disk: number; priceMonthly: number };
  networks: {
    v4: Array<{ ipAddress: string; type: 'public' | 'private' }>;
    v6: Array<{ ipAddress: string; type: 'public' | 'private' }>;
  };
  tags: string[];
  createdAt: string;
}

export interface DOSize {
  slug: string;
  memory: number;
  vcpus: number;
  disk: number;
  transfer: number;
  priceMonthly: number;
  priceHourly: number;
  regions: string[];
  available: boolean;
  description: string;
}

export interface DOImage {
  id: number;
  name: string;
  slug?: string;
  type: 'snapshot' | 'backup' | 'custom';
  distribution: string;
  status: 'available' | 'pending' | 'deleted';
  minDiskSize: number;
  sizeGigabytes: number;
  createdAt: string;
}

export interface DORegion {
  slug: string;
  name: string;
  sizes: string[];
  features: string[];
  available: boolean;
}

export interface DOSSHKey {
  id: number;
  name: string;
  fingerprint: string;
  publicKey: string;
}

export interface DOVolume {
  id: string;
  name: string;
  region: { slug: string };
  sizeGigabytes: number;
  filesystemType: string;
  filesystemLabel?: string;
  dropletIds: number[];
  createdAt: string;
}

export interface DOKubernetesCluster {
  id: string;
  name: string;
  region: string;
  version: string;
  status: { state: 'running' | 'provisioning' | 'degraded' | 'error' };
  nodePools: Array<{
    id: string;
    name: string;
    size: string;
    count: number;
    nodes: Array<{ id: string; name: string; status: { state: string } }>;
  }>;
  createdAt: string;
}

export interface DOFirewall {
  id: string;
  name: string;
  status: 'waiting' | 'succeeded' | 'failed';
  inboundRules: Array<{
    protocol: 'tcp' | 'udp' | 'icmp';
    ports: string;
    sources: { addresses?: string[]; dropletIds?: number[]; tags?: string[] };
  }>;
  outboundRules: Array<{
    protocol: 'tcp' | 'udp' | 'icmp';
    ports: string;
    destinations: { addresses?: string[]; dropletIds?: number[]; tags?: string[] };
  }>;
  dropletIds: number[];
  tags: string[];
  createdAt: string;
}

/**
 * DigitalOcean Platform Client
 *
 * Environment Variables Required:
 * - DIGITALOCEAN_API_KEY: Your DigitalOcean API token
 * - DIGITALOCEAN_ENABLED: Set to 'true' to enable
 */
export class DigitalOceanClient {
  private config: PlatformConfig;
  private http: SafeHttpClient;

  constructor() {
    this.config = createPlatformConfig(
      'DigitalOcean',
      'https://api.digitalocean.com/v2',
      'DIGITALOCEAN',
      { version: 'v2', rateLimitPerMinute: 250 }
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
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[camelKey] = this.toCamelCase(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        result[camelKey] = value.map(v =>
          typeof v === 'object' ? this.toCamelCase(v as Record<string, unknown>) : v
        );
      } else {
        result[camelKey] = value;
      }
    }
    return result;
  }

  // =====================
  // Droplets
  // =====================

  async listDroplets(options?: { tagName?: string; perPage?: number }): Promise<DODroplet[]> {
    const response = await this.http.get<{ droplets: Array<Record<string, unknown>> }>('/droplets', {
      tag_name: options?.tagName || '',
      per_page: String(options?.perPage || 50),
    });
    return response.data.droplets.map(d => this.toCamelCase(d) as unknown as DODroplet);
  }

  async getDroplet(dropletId: number): Promise<DODroplet> {
    const response = await this.http.get<{ droplet: Record<string, unknown> }>(
      `/droplets/${dropletId}`
    );
    return this.toCamelCase(response.data.droplet) as unknown as DODroplet;
  }

  async createDroplet(options: {
    name: string;
    region: string;
    size: string;
    image: string | number;
    sshKeys?: (string | number)[];
    backups?: boolean;
    ipv6?: boolean;
    monitoring?: boolean;
    tags?: string[];
    userData?: string;
    vpcUuid?: string;
  }): Promise<DODroplet> {
    const response = await this.http.post<{ droplet: Record<string, unknown> }>('/droplets', {
      name: options.name,
      region: options.region,
      size: options.size,
      image: options.image,
      ssh_keys: options.sshKeys,
      backups: options.backups,
      ipv6: options.ipv6,
      monitoring: options.monitoring,
      tags: options.tags,
      user_data: options.userData,
      vpc_uuid: options.vpcUuid,
    });
    return this.toCamelCase(response.data.droplet) as unknown as DODroplet;
  }

  async deleteDroplet(dropletId: number): Promise<void> {
    await this.http.delete(`/droplets/${dropletId}`);
  }

  async powerOnDroplet(dropletId: number): Promise<void> {
    await this.http.post(`/droplets/${dropletId}/actions`, { type: 'power_on' });
  }

  async powerOffDroplet(dropletId: number): Promise<void> {
    await this.http.post(`/droplets/${dropletId}/actions`, { type: 'power_off' });
  }

  async rebootDroplet(dropletId: number): Promise<void> {
    await this.http.post(`/droplets/${dropletId}/actions`, { type: 'reboot' });
  }

  async rebuildDroplet(dropletId: number, image: string | number): Promise<void> {
    await this.http.post(`/droplets/${dropletId}/actions`, { type: 'rebuild', image });
  }

  async resizeDroplet(dropletId: number, size: string, resizeDisk?: boolean): Promise<void> {
    await this.http.post(`/droplets/${dropletId}/actions`, {
      type: 'resize',
      size,
      disk: resizeDisk,
    });
  }

  async snapshotDroplet(dropletId: number, name: string): Promise<void> {
    await this.http.post(`/droplets/${dropletId}/actions`, { type: 'snapshot', name });
  }

  // =====================
  // Sizes/Regions/Images
  // =====================

  async listSizes(): Promise<DOSize[]> {
    const response = await this.http.get<{ sizes: Array<Record<string, unknown>> }>('/sizes');
    return response.data.sizes.map(s => this.toCamelCase(s) as unknown as DOSize);
  }

  async listRegions(): Promise<DORegion[]> {
    const response = await this.http.get<{ regions: Array<Record<string, unknown>> }>('/regions');
    return response.data.regions.map(r => this.toCamelCase(r) as unknown as DORegion);
  }

  async listImages(options?: { type?: 'distribution' | 'application'; private?: boolean }): Promise<DOImage[]> {
    const response = await this.http.get<{ images: Array<Record<string, unknown>> }>('/images', {
      type: options?.type || '',
      private: options?.private?.toString() || '',
    });
    return response.data.images.map(i => this.toCamelCase(i) as unknown as DOImage);
  }

  // =====================
  // SSH Keys
  // =====================

  async listSSHKeys(): Promise<DOSSHKey[]> {
    const response = await this.http.get<{ ssh_keys: Array<Record<string, unknown>> }>(
      '/account/keys'
    );
    return response.data.ssh_keys.map(k => this.toCamelCase(k) as unknown as DOSSHKey);
  }

  async createSSHKey(name: string, publicKey: string): Promise<DOSSHKey> {
    const response = await this.http.post<{ ssh_key: Record<string, unknown> }>('/account/keys', {
      name,
      public_key: publicKey,
    });
    return this.toCamelCase(response.data.ssh_key) as unknown as DOSSHKey;
  }

  async deleteSSHKey(keyId: number): Promise<void> {
    await this.http.delete(`/account/keys/${keyId}`);
  }

  // =====================
  // Volumes
  // =====================

  async listVolumes(region?: string): Promise<DOVolume[]> {
    const response = await this.http.get<{ volumes: Array<Record<string, unknown>> }>('/volumes', {
      region: region || '',
    });
    return response.data.volumes.map(v => this.toCamelCase(v) as unknown as DOVolume);
  }

  async createVolume(options: {
    name: string;
    region: string;
    sizeGigabytes: number;
    description?: string;
    filesystemType?: 'ext4' | 'xfs';
    filesystemLabel?: string;
    tags?: string[];
  }): Promise<DOVolume> {
    const response = await this.http.post<{ volume: Record<string, unknown> }>('/volumes', {
      name: options.name,
      region: options.region,
      size_gigabytes: options.sizeGigabytes,
      description: options.description,
      filesystem_type: options.filesystemType || 'ext4',
      filesystem_label: options.filesystemLabel,
      tags: options.tags,
    });
    return this.toCamelCase(response.data.volume) as unknown as DOVolume;
  }

  async attachVolume(volumeId: string, dropletId: number, region: string): Promise<void> {
    await this.http.post(`/volumes/${volumeId}/actions`, {
      type: 'attach',
      droplet_id: dropletId,
      region,
    });
  }

  async detachVolume(volumeId: string, dropletId: number, region: string): Promise<void> {
    await this.http.post(`/volumes/${volumeId}/actions`, {
      type: 'detach',
      droplet_id: dropletId,
      region,
    });
  }

  // =====================
  // Kubernetes
  // =====================

  async listKubernetesClusters(): Promise<DOKubernetesCluster[]> {
    const response = await this.http.get<{ kubernetes_clusters: Array<Record<string, unknown>> }>(
      '/kubernetes/clusters'
    );
    return response.data.kubernetes_clusters.map(
      c => this.toCamelCase(c) as unknown as DOKubernetesCluster
    );
  }

  async getKubernetesCluster(clusterId: string): Promise<DOKubernetesCluster> {
    const response = await this.http.get<{ kubernetes_cluster: Record<string, unknown> }>(
      `/kubernetes/clusters/${clusterId}`
    );
    return this.toCamelCase(response.data.kubernetes_cluster) as unknown as DOKubernetesCluster;
  }

  async getKubernetesKubeconfig(clusterId: string): Promise<string> {
    const response = await this.http.get<{ kubeconfig: string }>(
      `/kubernetes/clusters/${clusterId}/kubeconfig`
    );
    return response.data.kubeconfig;
  }

  // =====================
  // Firewalls
  // =====================

  async listFirewalls(): Promise<DOFirewall[]> {
    const response = await this.http.get<{ firewalls: Array<Record<string, unknown>> }>(
      '/firewalls'
    );
    return response.data.firewalls.map(f => this.toCamelCase(f) as unknown as DOFirewall);
  }

  async createFirewall(options: {
    name: string;
    inboundRules?: DOFirewall['inboundRules'];
    outboundRules?: DOFirewall['outboundRules'];
    dropletIds?: number[];
    tags?: string[];
  }): Promise<DOFirewall> {
    const response = await this.http.post<{ firewall: Record<string, unknown> }>('/firewalls', {
      name: options.name,
      inbound_rules: options.inboundRules,
      outbound_rules: options.outboundRules,
      droplet_ids: options.dropletIds,
      tags: options.tags,
    });
    return this.toCamelCase(response.data.firewall) as unknown as DOFirewall;
  }
}

export default DigitalOceanClient;
