/**
 * BlackRoad Platform Integration - Shellfish (iOS SSH Client)
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Shellfish SSH client integration for iOS automation:
 * - SSH connection management
 * - Key management
 * - Snippet synchronization
 * - x-callback-url support for Shortcuts integration
 */

import { createPlatformConfig, PlatformConfig } from '../core';

export interface ShellfishHost {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key' | 'agent';
  keyName?: string;
  jumpHost?: string;
  localPortForwards?: Array<{
    localPort: number;
    remoteHost: string;
    remotePort: number;
  }>;
  remotePortForwards?: Array<{
    remotePort: number;
    localHost: string;
    localPort: number;
  }>;
  tags?: string[];
}

export interface ShellfishSnippet {
  id: string;
  name: string;
  command: string;
  description?: string;
  tags?: string[];
}

export interface ShellfishKey {
  name: string;
  type: 'ed25519' | 'rsa' | 'ecdsa';
  publicKey: string;
  fingerprint: string;
  createdAt: string;
}

export interface XCallbackURLParams {
  host?: string;
  cmd?: string;
  snippet?: string;
  'x-success'?: string;
  'x-error'?: string;
  'x-cancel'?: string;
}

/**
 * Shellfish Integration Client
 *
 * Provides automation capabilities for the Shellfish iOS SSH client.
 * Uses x-callback-url scheme for iOS Shortcuts integration.
 *
 * Note: This integration is designed for generating configuration
 * that can be imported into Shellfish on iOS devices.
 */
export class ShellfishClient {
  private config: PlatformConfig;
  private hosts: Map<string, ShellfishHost> = new Map();
  private snippets: Map<string, ShellfishSnippet> = new Map();
  private keys: Map<string, ShellfishKey> = new Map();

  constructor() {
    this.config = createPlatformConfig(
      'Shellfish',
      'shellfish://', // URL scheme for Shellfish
      'SHELLFISH',
      { version: 'v1' }
    );
  }

  // =====================
  // Host Management
  // =====================

  /**
   * Add a host configuration
   */
  addHost(host: Omit<ShellfishHost, 'id'>): ShellfishHost {
    const id = `host-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullHost: ShellfishHost = { ...host, id };
    this.hosts.set(id, fullHost);
    return fullHost;
  }

  /**
   * Get all hosts
   */
  listHosts(): ShellfishHost[] {
    return Array.from(this.hosts.values());
  }

  /**
   * Get host by ID
   */
  getHost(hostId: string): ShellfishHost | undefined {
    return this.hosts.get(hostId);
  }

  /**
   * Update host configuration
   */
  updateHost(hostId: string, updates: Partial<ShellfishHost>): ShellfishHost | undefined {
    const host = this.hosts.get(hostId);
    if (!host) return undefined;

    const updated = { ...host, ...updates, id: hostId };
    this.hosts.set(hostId, updated);
    return updated;
  }

  /**
   * Remove a host
   */
  removeHost(hostId: string): boolean {
    return this.hosts.delete(hostId);
  }

  // =====================
  // Snippet Management
  // =====================

  /**
   * Add a snippet
   */
  addSnippet(snippet: Omit<ShellfishSnippet, 'id'>): ShellfishSnippet {
    const id = `snippet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullSnippet: ShellfishSnippet = { ...snippet, id };
    this.snippets.set(id, fullSnippet);
    return fullSnippet;
  }

  /**
   * Get all snippets
   */
  listSnippets(): ShellfishSnippet[] {
    return Array.from(this.snippets.values());
  }

  /**
   * Get snippet by ID
   */
  getSnippet(snippetId: string): ShellfishSnippet | undefined {
    return this.snippets.get(snippetId);
  }

  /**
   * Update snippet
   */
  updateSnippet(snippetId: string, updates: Partial<ShellfishSnippet>): ShellfishSnippet | undefined {
    const snippet = this.snippets.get(snippetId);
    if (!snippet) return undefined;

    const updated = { ...snippet, ...updates, id: snippetId };
    this.snippets.set(snippetId, updated);
    return updated;
  }

  /**
   * Remove a snippet
   */
  removeSnippet(snippetId: string): boolean {
    return this.snippets.delete(snippetId);
  }

  // =====================
  // Key Management
  // =====================

  /**
   * Register an SSH key
   */
  registerKey(key: ShellfishKey): void {
    this.keys.set(key.name, key);
  }

  /**
   * List registered keys
   */
  listKeys(): ShellfishKey[] {
    return Array.from(this.keys.values());
  }

  /**
   * Get key by name
   */
  getKey(keyName: string): ShellfishKey | undefined {
    return this.keys.get(keyName);
  }

  // =====================
  // x-callback-url Generation
  // =====================

  /**
   * Generate x-callback-url for Shellfish action
   */
  generateCallbackURL(action: 'connect' | 'run' | 'snippet', params: XCallbackURLParams): string {
    const baseURL = `shellfish://x-callback-url/${action}`;
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value) {
        queryParams.append(key, value);
      }
    }

    const queryString = queryParams.toString();
    return queryString ? `${baseURL}?${queryString}` : baseURL;
  }

  /**
   * Generate URL to connect to a host
   */
  generateConnectURL(hostName: string, callbacks?: {
    success?: string;
    error?: string;
    cancel?: string;
  }): string {
    return this.generateCallbackURL('connect', {
      host: hostName,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
      'x-cancel': callbacks?.cancel,
    });
  }

  /**
   * Generate URL to run a command on a host
   */
  generateRunURL(hostName: string, command: string, callbacks?: {
    success?: string;
    error?: string;
    cancel?: string;
  }): string {
    return this.generateCallbackURL('run', {
      host: hostName,
      cmd: command,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
      'x-cancel': callbacks?.cancel,
    });
  }

  /**
   * Generate URL to run a snippet on a host
   */
  generateSnippetURL(hostName: string, snippetName: string, callbacks?: {
    success?: string;
    error?: string;
    cancel?: string;
  }): string {
    return this.generateCallbackURL('snippet', {
      host: hostName,
      snippet: snippetName,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
      'x-cancel': callbacks?.cancel,
    });
  }

  // =====================
  // Export/Import
  // =====================

  /**
   * Export configuration for Shellfish import
   * Returns a JSON structure that can be converted to the Shellfish import format
   */
  exportConfiguration(): {
    hosts: ShellfishHost[];
    snippets: ShellfishSnippet[];
    keys: ShellfishKey[];
  } {
    return {
      hosts: this.listHosts(),
      snippets: this.listSnippets(),
      keys: this.listKeys(),
    };
  }

  /**
   * Import configuration
   */
  importConfiguration(config: {
    hosts?: ShellfishHost[];
    snippets?: ShellfishSnippet[];
    keys?: ShellfishKey[];
  }): void {
    if (config.hosts) {
      for (const host of config.hosts) {
        this.hosts.set(host.id, host);
      }
    }
    if (config.snippets) {
      for (const snippet of config.snippets) {
        this.snippets.set(snippet.id, snippet);
      }
    }
    if (config.keys) {
      for (const key of config.keys) {
        this.keys.set(key.name, key);
      }
    }
  }

  // =====================
  // BlackRoad Integration
  // =====================

  /**
   * Create BlackRoad deployment snippets
   */
  createBlackRoadSnippets(): void {
    const snippets: Omit<ShellfishSnippet, 'id'>[] = [
      {
        name: 'br-status',
        command: 'br status',
        description: 'Check BlackRoad system status',
        tags: ['blackroad', 'status'],
      },
      {
        name: 'br-logs',
        command: 'br logs --tail 100',
        description: 'View recent BlackRoad logs',
        tags: ['blackroad', 'logs'],
      },
      {
        name: 'br-deploy',
        command: 'br deploy',
        description: 'Deploy BlackRoad application',
        tags: ['blackroad', 'deploy'],
      },
      {
        name: 'br-restart',
        command: 'br restart --all',
        description: 'Restart all BlackRoad services',
        tags: ['blackroad', 'restart'],
      },
      {
        name: 'br-health',
        command: 'br health check',
        description: 'Run health check on BlackRoad services',
        tags: ['blackroad', 'health'],
      },
    ];

    for (const snippet of snippets) {
      this.addSnippet(snippet);
    }
  }

  /**
   * Generate iOS Shortcut actions for BlackRoad automation
   */
  generateShortcutActions(hostName: string): string {
    const actions = [
      {
        name: 'Check Status',
        url: this.generateRunURL(hostName, 'br status'),
      },
      {
        name: 'View Logs',
        url: this.generateRunURL(hostName, 'br logs --tail 50'),
      },
      {
        name: 'Deploy',
        url: this.generateRunURL(hostName, 'br deploy'),
      },
      {
        name: 'Restart Services',
        url: this.generateRunURL(hostName, 'br restart --all'),
      },
    ];

    return JSON.stringify(actions, null, 2);
  }
}

export default ShellfishClient;
