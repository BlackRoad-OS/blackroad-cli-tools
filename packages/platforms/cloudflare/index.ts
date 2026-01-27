/**
 * BlackRoad Platform Integration - Cloudflare
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Cloudflare platform integration for:
 * - Workers deployment
 * - DNS management
 * - Pages deployment
 * - R2 storage
 * - KV namespace management
 * - D1 database operations
 */

import { createPlatformConfig, SafeHttpClient, PlatformConfig } from '../core';

export interface CloudflareZone {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'initializing' | 'moved' | 'deleted' | 'deactivated';
  type: 'full' | 'partial' | 'secondary';
  nameServers: string[];
  createdOn: string;
  modifiedOn: string;
}

export interface CloudflareDNSRecord {
  id: string;
  zoneId: string;
  name: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'SRV' | 'CAA';
  content: string;
  ttl: number;
  proxied: boolean;
  priority?: number;
}

export interface CloudflareWorker {
  id: string;
  name: string;
  createdOn: string;
  modifiedOn: string;
  etag: string;
}

export interface CloudflareKVNamespace {
  id: string;
  title: string;
  supportsUrlEncoding: boolean;
}

export interface CloudflareR2Bucket {
  name: string;
  creationDate: string;
  location: string;
}

export interface CloudflareD1Database {
  uuid: string;
  name: string;
  version: string;
  numTables: number;
  fileSize: number;
  createdAt: string;
}

export interface CloudflarePagesProject {
  id: string;
  name: string;
  subdomain: string;
  domains: string[];
  createdOn: string;
  productionBranch: string;
}

/**
 * Cloudflare Platform Client
 *
 * Environment Variables Required:
 * - CLOUDFLARE_API_KEY: Your Cloudflare API token (or Global API Key)
 * - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID
 * - CLOUDFLARE_ENABLED: Set to 'true' to enable
 */
export class CloudflareClient {
  private config: PlatformConfig;
  private http: SafeHttpClient;
  private accountId: string;

  constructor() {
    this.config = createPlatformConfig(
      'Cloudflare',
      'https://api.cloudflare.com/client/v4',
      'CLOUDFLARE',
      { version: 'v4', rateLimitPerMinute: 1200 }
    );
    this.http = new SafeHttpClient(this.config);
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
  }

  /**
   * Unwrap Cloudflare API response
   */
  private unwrap<T>(response: { result: T; success: boolean; errors: Array<{ message: string }> }): T {
    if (!response.success) {
      throw new Error(`Cloudflare API Error: ${response.errors[0]?.message || 'Unknown error'}`);
    }
    return response.result;
  }

  // =====================
  // Zone Management
  // =====================

  async listZones(): Promise<CloudflareZone[]> {
    const response = await this.http.get<{
      result: CloudflareZone[];
      success: boolean;
      errors: Array<{ message: string }>;
    }>('/zones');
    return this.unwrap(response.data);
  }

  async getZone(zoneId: string): Promise<CloudflareZone> {
    const response = await this.http.get<{
      result: CloudflareZone;
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/zones/${zoneId}`);
    return this.unwrap(response.data);
  }

  // =====================
  // DNS Management
  // =====================

  async listDNSRecords(zoneId: string): Promise<CloudflareDNSRecord[]> {
    const response = await this.http.get<{
      result: CloudflareDNSRecord[];
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/zones/${zoneId}/dns_records`);
    return this.unwrap(response.data);
  }

  async createDNSRecord(
    zoneId: string,
    record: Omit<CloudflareDNSRecord, 'id' | 'zoneId'>
  ): Promise<CloudflareDNSRecord> {
    const response = await this.http.post<{
      result: CloudflareDNSRecord;
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/zones/${zoneId}/dns_records`, record);
    return this.unwrap(response.data);
  }

  async updateDNSRecord(
    zoneId: string,
    recordId: string,
    record: Partial<CloudflareDNSRecord>
  ): Promise<CloudflareDNSRecord> {
    const response = await this.http.patch<{
      result: CloudflareDNSRecord;
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/zones/${zoneId}/dns_records/${recordId}`, record);
    return this.unwrap(response.data);
  }

  async deleteDNSRecord(zoneId: string, recordId: string): Promise<void> {
    await this.http.delete(`/zones/${zoneId}/dns_records/${recordId}`);
  }

  // =====================
  // Workers
  // =====================

  async listWorkers(): Promise<CloudflareWorker[]> {
    const response = await this.http.get<{
      result: CloudflareWorker[];
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/accounts/${this.accountId}/workers/scripts`);
    return this.unwrap(response.data);
  }

  async deployWorker(name: string, script: string, bindings?: Record<string, unknown>): Promise<CloudflareWorker> {
    // Note: Actual worker deployment requires multipart form data
    // This is a simplified representation
    const response = await this.http.put<{
      result: CloudflareWorker;
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/accounts/${this.accountId}/workers/scripts/${name}`, {
      script,
      bindings,
    });
    return this.unwrap(response.data);
  }

  async deleteWorker(name: string): Promise<void> {
    await this.http.delete(`/accounts/${this.accountId}/workers/scripts/${name}`);
  }

  // =====================
  // KV Namespaces
  // =====================

  async listKVNamespaces(): Promise<CloudflareKVNamespace[]> {
    const response = await this.http.get<{
      result: CloudflareKVNamespace[];
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/accounts/${this.accountId}/storage/kv/namespaces`);
    return this.unwrap(response.data);
  }

  async createKVNamespace(title: string): Promise<CloudflareKVNamespace> {
    const response = await this.http.post<{
      result: CloudflareKVNamespace;
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/accounts/${this.accountId}/storage/kv/namespaces`, { title });
    return this.unwrap(response.data);
  }

  async getKVValue(namespaceId: string, key: string): Promise<string> {
    const response = await this.http.get<string>(
      `/accounts/${this.accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`
    );
    return response.data;
  }

  async setKVValue(namespaceId: string, key: string, value: string): Promise<void> {
    await this.http.put(
      `/accounts/${this.accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`,
      value
    );
  }

  // =====================
  // R2 Storage
  // =====================

  async listR2Buckets(): Promise<CloudflareR2Bucket[]> {
    const response = await this.http.get<{
      result: { buckets: CloudflareR2Bucket[] };
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/accounts/${this.accountId}/r2/buckets`);
    return this.unwrap(response.data).buckets;
  }

  async createR2Bucket(name: string, locationHint?: string): Promise<CloudflareR2Bucket> {
    const response = await this.http.post<{
      result: CloudflareR2Bucket;
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/accounts/${this.accountId}/r2/buckets`, {
      name,
      locationHint,
    });
    return this.unwrap(response.data);
  }

  async deleteR2Bucket(name: string): Promise<void> {
    await this.http.delete(`/accounts/${this.accountId}/r2/buckets/${name}`);
  }

  // =====================
  // D1 Database
  // =====================

  async listD1Databases(): Promise<CloudflareD1Database[]> {
    const response = await this.http.get<{
      result: CloudflareD1Database[];
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/accounts/${this.accountId}/d1/database`);
    return this.unwrap(response.data);
  }

  async createD1Database(name: string): Promise<CloudflareD1Database> {
    const response = await this.http.post<{
      result: CloudflareD1Database;
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/accounts/${this.accountId}/d1/database`, { name });
    return this.unwrap(response.data);
  }

  async queryD1Database(databaseId: string, sql: string, params?: unknown[]): Promise<unknown[]> {
    const response = await this.http.post<{
      result: Array<{ results: unknown[] }>;
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/accounts/${this.accountId}/d1/database/${databaseId}/query`, {
      sql,
      params,
    });
    return this.unwrap(response.data)[0]?.results || [];
  }

  // =====================
  // Pages
  // =====================

  async listPagesProjects(): Promise<CloudflarePagesProject[]> {
    const response = await this.http.get<{
      result: CloudflarePagesProject[];
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/accounts/${this.accountId}/pages/projects`);
    return this.unwrap(response.data);
  }

  async getPagesProject(projectName: string): Promise<CloudflarePagesProject> {
    const response = await this.http.get<{
      result: CloudflarePagesProject;
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/accounts/${this.accountId}/pages/projects/${projectName}`);
    return this.unwrap(response.data);
  }

  // =====================
  // Tunnels (Cloudflare Tunnel)
  // =====================

  async listTunnels(): Promise<Array<{ id: string; name: string; status: string; createdAt: string }>> {
    const response = await this.http.get<{
      result: Array<{ id: string; name: string; status: string; created_at: string }>;
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/accounts/${this.accountId}/cfd_tunnel`);
    return this.unwrap(response.data).map(t => ({
      id: t.id,
      name: t.name,
      status: t.status,
      createdAt: t.created_at,
    }));
  }

  async createTunnel(name: string): Promise<{ id: string; name: string; token: string }> {
    const response = await this.http.post<{
      result: { id: string; name: string; token: string };
      success: boolean;
      errors: Array<{ message: string }>;
    }>(`/accounts/${this.accountId}/cfd_tunnel`, { name });
    return this.unwrap(response.data);
  }
}

export default CloudflareClient;
