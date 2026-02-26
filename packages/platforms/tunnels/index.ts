/**
 * BlackRoad Platform Integration - Tunnels
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Unified tunneling integration for:
 * - Cloudflare Tunnel (cloudflared)
 * - ngrok
 * - localtunnel
 * - Tailscale Funnel
 * - bore
 * - frp
 *
 * Provides secure remote access to local services.
 */

import { createPlatformConfig, SafeHttpClient, PlatformConfig } from '../core';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export type TunnelProvider = 'cloudflare' | 'ngrok' | 'localtunnel' | 'tailscale' | 'bore' | 'frp';

export interface TunnelConfig {
  provider: TunnelProvider;
  localPort: number;
  localHost?: string;
  subdomain?: string;
  region?: string;
  authToken?: string;
  customDomain?: string;
  protocol?: 'http' | 'https' | 'tcp' | 'tls';
}

export interface TunnelConnection {
  id: string;
  provider: TunnelProvider;
  localPort: number;
  localHost: string;
  publicUrl: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  createdAt: string;
  metrics?: {
    bytesIn: number;
    bytesOut: number;
    requestsTotal: number;
    connectionsActive: number;
  };
  error?: string;
}

export interface NgrokTunnel {
  name: string;
  uri: string;
  publicUrl: string;
  proto: string;
  config: {
    addr: string;
    inspect: boolean;
  };
  metrics?: {
    conns: { count: number; gauge: number; rate1: number; rate5: number; rate15: number; p50: number; p90: number; p95: number; p99: number };
    http: { count: number; rate1: number; rate5: number; rate15: number; p50: number; p90: number; p95: number; p99: number };
  };
}

export interface CloudflareTunnel {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  deletedAt?: string;
  connections: Array<{
    id: string;
    features: string[];
    version: string;
    arch: string;
    connectedAt: string;
  }>;
}

/**
 * Unified Tunnel Manager
 *
 * Environment Variables:
 * - NGROK_AUTH_TOKEN: ngrok authentication token
 * - CLOUDFLARE_TUNNEL_TOKEN: Cloudflare Tunnel token
 * - TAILSCALE_AUTH_KEY: Tailscale authentication key
 * - TUNNEL_ENABLED: Set to 'true' to enable
 */
export class TunnelClient {
  private config: PlatformConfig;
  private activeTunnels: Map<string, TunnelConnection> = new Map();
  private processes: Map<string, child_process.ChildProcess> = new Map();

  constructor() {
    this.config = createPlatformConfig(
      'Tunnels',
      'http://localhost:4040', // ngrok local API default
      'TUNNEL',
      { version: 'v1' }
    );
  }

  /**
   * Check if a tunnel provider is installed
   */
  isProviderInstalled(provider: TunnelProvider): boolean {
    const commands: Record<TunnelProvider, string> = {
      cloudflare: 'cloudflared',
      ngrok: 'ngrok',
      localtunnel: 'lt',
      tailscale: 'tailscale',
      bore: 'bore',
      frp: 'frpc',
    };

    try {
      child_process.execSync(`which ${commands[provider]}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): TunnelProvider[] {
    const providers: TunnelProvider[] = ['cloudflare', 'ngrok', 'localtunnel', 'tailscale', 'bore', 'frp'];
    return providers.filter(p => this.isProviderInstalled(p));
  }

  /**
   * Create a new tunnel
   */
  async createTunnel(config: TunnelConfig): Promise<TunnelConnection> {
    const id = `tunnel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const localHost = config.localHost || 'localhost';

    const connection: TunnelConnection = {
      id,
      provider: config.provider,
      localPort: config.localPort,
      localHost,
      publicUrl: '',
      status: 'connecting',
      createdAt: new Date().toISOString(),
    };

    this.activeTunnels.set(id, connection);

    try {
      const publicUrl = await this.startTunnel(id, config);
      connection.publicUrl = publicUrl;
      connection.status = 'connected';
    } catch (error) {
      connection.status = 'error';
      connection.error = (error as Error).message;
    }

    return connection;
  }

  /**
   * Start tunnel based on provider
   */
  private async startTunnel(id: string, config: TunnelConfig): Promise<string> {
    const localHost = config.localHost || 'localhost';
    const localAddr = `${localHost}:${config.localPort}`;

    switch (config.provider) {
      case 'ngrok':
        return this.startNgrokTunnel(id, config);

      case 'cloudflare':
        return this.startCloudflareTunnel(id, config);

      case 'localtunnel':
        return this.startLocaltunnel(id, config);

      case 'tailscale':
        return this.startTailscaleFunnel(id, config);

      case 'bore':
        return this.startBoreTunnel(id, config);

      case 'frp':
        return this.startFrpTunnel(id, config);

      default:
        throw new Error(`Unsupported tunnel provider: ${config.provider}`);
    }
  }

  /**
   * Start ngrok tunnel
   */
  private async startNgrokTunnel(id: string, config: TunnelConfig): Promise<string> {
    const args = ['http', String(config.localPort)];

    if (config.subdomain) {
      args.push('--subdomain', config.subdomain);
    }
    if (config.region) {
      args.push('--region', config.region);
    }
    if (config.authToken) {
      args.push('--authtoken', config.authToken);
    }

    return new Promise((resolve, reject) => {
      const proc = child_process.spawn('ngrok', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.processes.set(id, proc);

      // Wait for ngrok to start and get URL from API
      setTimeout(async () => {
        try {
          const response = await fetch('http://localhost:4040/api/tunnels');
          const data = await response.json() as { tunnels: NgrokTunnel[] };
          const tunnel = data.tunnels.find(t => t.config.addr.includes(String(config.localPort)));

          if (tunnel) {
            resolve(tunnel.publicUrl);
          } else {
            reject(new Error('Failed to get ngrok tunnel URL'));
          }
        } catch (error) {
          reject(error);
        }
      }, 3000);

      proc.on('error', reject);
    });
  }

  /**
   * Start Cloudflare Tunnel
   */
  private async startCloudflareTunnel(id: string, config: TunnelConfig): Promise<string> {
    const args = ['tunnel', '--url', `http://localhost:${config.localPort}`];

    if (config.authToken) {
      args.unshift('--token', config.authToken);
    }

    return new Promise((resolve, reject) => {
      const proc = child_process.spawn('cloudflared', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.processes.set(id, proc);

      let output = '';

      proc.stderr?.on('data', (data) => {
        output += data.toString();
        const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
        if (match) {
          resolve(match[0]);
        }
      });

      proc.on('error', reject);

      setTimeout(() => {
        if (!output.includes('trycloudflare.com')) {
          reject(new Error('Timeout waiting for Cloudflare tunnel'));
        }
      }, 30000);
    });
  }

  /**
   * Start localtunnel
   */
  private async startLocaltunnel(id: string, config: TunnelConfig): Promise<string> {
    const args = ['--port', String(config.localPort)];

    if (config.subdomain) {
      args.push('--subdomain', config.subdomain);
    }
    if (config.localHost) {
      args.push('--local-host', config.localHost);
    }

    return new Promise((resolve, reject) => {
      const proc = child_process.spawn('lt', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.processes.set(id, proc);

      proc.stdout?.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/https:\/\/[a-z0-9-]+\.loca\.lt/);
        if (match) {
          resolve(match[0]);
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Start Tailscale Funnel
   */
  private async startTailscaleFunnel(id: string, config: TunnelConfig): Promise<string> {
    const args = ['funnel', String(config.localPort)];

    return new Promise((resolve, reject) => {
      const proc = child_process.spawn('tailscale', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.processes.set(id, proc);

      // Get hostname for URL
      try {
        const hostname = child_process.execSync('tailscale status --json | jq -r .Self.DNSName', {
          encoding: 'utf-8',
        }).trim();

        resolve(`https://${hostname}`);
      } catch (error) {
        reject(new Error('Failed to get Tailscale hostname'));
      }

      proc.on('error', reject);
    });
  }

  /**
   * Start bore tunnel
   */
  private async startBoreTunnel(id: string, config: TunnelConfig): Promise<string> {
    const args = ['local', String(config.localPort), '--to', 'bore.pub'];

    return new Promise((resolve, reject) => {
      const proc = child_process.spawn('bore', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.processes.set(id, proc);

      proc.stdout?.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/bore\.pub:\d+/);
        if (match) {
          resolve(`tcp://${match[0]}`);
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Start frp tunnel (requires frps server)
   */
  private async startFrpTunnel(id: string, config: TunnelConfig): Promise<string> {
    // frp requires a config file
    const frpcConfig = `
[common]
server_addr = ${process.env.FRP_SERVER_ADDR || '127.0.0.1'}
server_port = ${process.env.FRP_SERVER_PORT || '7000'}
token = ${config.authToken || process.env.FRP_TOKEN || ''}

[${id}]
type = ${config.protocol || 'http'}
local_ip = ${config.localHost || '127.0.0.1'}
local_port = ${config.localPort}
${config.customDomain ? `custom_domains = ${config.customDomain}` : ''}
`;

    const configPath = path.join('/tmp', `frpc-${id}.ini`);
    fs.writeFileSync(configPath, frpcConfig);

    return new Promise((resolve, reject) => {
      const proc = child_process.spawn('frpc', ['-c', configPath], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.processes.set(id, proc);

      setTimeout(() => {
        if (config.customDomain) {
          resolve(`http://${config.customDomain}`);
        } else {
          resolve(`http://${process.env.FRP_SERVER_ADDR}:${config.localPort}`);
        }
      }, 2000);

      proc.on('error', reject);
    });
  }

  /**
   * Close a tunnel
   */
  closeTunnel(tunnelId: string): boolean {
    const proc = this.processes.get(tunnelId);
    const connection = this.activeTunnels.get(tunnelId);

    if (proc) {
      proc.kill('SIGTERM');
      this.processes.delete(tunnelId);
    }

    if (connection) {
      connection.status = 'disconnected';
      this.activeTunnels.delete(tunnelId);
      return true;
    }

    return false;
  }

  /**
   * Get tunnel status
   */
  getTunnel(tunnelId: string): TunnelConnection | undefined {
    return this.activeTunnels.get(tunnelId);
  }

  /**
   * List all active tunnels
   */
  listTunnels(): TunnelConnection[] {
    return Array.from(this.activeTunnels.values());
  }

  /**
   * Close all tunnels
   */
  closeAllTunnels(): void {
    for (const [id] of this.activeTunnels) {
      this.closeTunnel(id);
    }
  }

  /**
   * Get ngrok tunnels via API
   */
  async getNgrokTunnels(): Promise<NgrokTunnel[]> {
    try {
      const response = await fetch('http://localhost:4040/api/tunnels');
      const data = await response.json() as { tunnels: NgrokTunnel[] };
      return data.tunnels;
    } catch {
      return [];
    }
  }

  /**
   * Quick tunnel - creates a tunnel with best available provider
   */
  async quickTunnel(port: number): Promise<TunnelConnection> {
    const providers = this.getAvailableProviders();

    // Prefer in this order: cloudflare, ngrok, localtunnel, others
    const preferredOrder: TunnelProvider[] = ['cloudflare', 'ngrok', 'localtunnel', 'tailscale', 'bore', 'frp'];
    const provider = preferredOrder.find(p => providers.includes(p));

    if (!provider) {
      throw new Error('No tunnel provider available. Please install ngrok, cloudflared, or localtunnel.');
    }

    return this.createTunnel({
      provider,
      localPort: port,
    });
  }
}

export default TunnelClient;
