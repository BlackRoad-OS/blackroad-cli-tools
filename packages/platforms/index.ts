/**
 * BlackRoad Platform Integrations - Master Registry
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Unified platform integration layer for BlackRoad OS.
 * All integrations are safe, auditable, and use permissive licenses.
 */

// Core infrastructure
export * from './core';

// Cloud deployment platforms
export { RailwayClient } from './railway';
export { CloudflareClient } from './cloudflare';
export { VercelClient } from './vercel';
export { DigitalOceanClient } from './digitalocean';

// Developer platforms
export { GitHubClient } from './github';
export { DockerClient } from './docker';

// Mobile/iOS development tools
export { WarpClient } from './warp';
export { ShellfishClient } from './shellfish';
export { WorkingCopyClient } from './working-copy';
export { PytoClient } from './pyto';

// Hardware platforms
export { RaspberryPiClient } from './raspberry-pi';

// Productivity & collaboration
export { AsanaClient } from './asana';
export { NotionClient } from './notion';

// Authentication & payments
export { ClerkClient } from './clerk';
export { StripeClient } from './stripe';

// AI & ML
export { HuggingFaceClient } from './huggingface';
export { OSSModelsClient, SAFE_MODEL_REGISTRY } from './oss-models';

// Networking
export { TunnelClient } from './tunnels';

/**
 * Platform categories for organization
 */
export type PlatformCategory =
  | 'cloud-deployment'
  | 'developer-tools'
  | 'mobile-ios'
  | 'hardware'
  | 'productivity'
  | 'auth-payments'
  | 'ai-ml'
  | 'networking';

/**
 * Platform registration entry
 */
export interface PlatformEntry {
  name: string;
  category: PlatformCategory;
  description: string;
  envPrefix: string;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  docs?: string;
}

/**
 * Master registry of all platforms
 */
export const PLATFORM_REGISTRY: PlatformEntry[] = [
  // Cloud Deployment
  {
    name: 'Railway',
    category: 'cloud-deployment',
    description: 'Railway.app deployment platform',
    envPrefix: 'RAILWAY',
    requiredEnvVars: ['RAILWAY_API_KEY'],
    optionalEnvVars: ['RAILWAY_ENABLED'],
    docs: 'https://docs.railway.app/reference/public-api',
  },
  {
    name: 'Cloudflare',
    category: 'cloud-deployment',
    description: 'Cloudflare Workers, DNS, R2, KV, D1, and more',
    envPrefix: 'CLOUDFLARE',
    requiredEnvVars: ['CLOUDFLARE_API_KEY', 'CLOUDFLARE_ACCOUNT_ID'],
    optionalEnvVars: ['CLOUDFLARE_ENABLED'],
    docs: 'https://developers.cloudflare.com/api/',
  },
  {
    name: 'Vercel',
    category: 'cloud-deployment',
    description: 'Vercel deployment platform',
    envPrefix: 'VERCEL',
    requiredEnvVars: ['VERCEL_ACCESS_TOKEN'],
    optionalEnvVars: ['VERCEL_TEAM_ID', 'VERCEL_ENABLED'],
    docs: 'https://vercel.com/docs/rest-api',
  },
  {
    name: 'DigitalOcean',
    category: 'cloud-deployment',
    description: 'DigitalOcean Droplets, Kubernetes, Spaces, and more',
    envPrefix: 'DIGITALOCEAN',
    requiredEnvVars: ['DIGITALOCEAN_API_KEY'],
    optionalEnvVars: ['DIGITALOCEAN_ENABLED'],
    docs: 'https://docs.digitalocean.com/reference/api/',
  },

  // Developer Tools
  {
    name: 'GitHub',
    category: 'developer-tools',
    description: 'GitHub repositories, issues, PRs, and Actions',
    envPrefix: 'GITHUB',
    requiredEnvVars: ['GITHUB_ACCESS_TOKEN'],
    optionalEnvVars: ['GITHUB_ENABLED'],
    docs: 'https://docs.github.com/en/rest',
  },
  {
    name: 'Docker',
    category: 'developer-tools',
    description: 'Docker container management',
    envPrefix: 'DOCKER',
    requiredEnvVars: [],
    optionalEnvVars: ['DOCKER_HOST', 'DOCKER_CERT_PATH', 'DOCKER_TLS_VERIFY', 'DOCKER_ENABLED'],
    docs: 'https://docs.docker.com/engine/api/',
  },

  // Mobile/iOS
  {
    name: 'Warp',
    category: 'mobile-ios',
    description: 'Warp terminal workflow and theme management',
    envPrefix: 'WARP',
    requiredEnvVars: [],
    optionalEnvVars: ['WARP_ENABLED'],
    docs: 'https://docs.warp.dev/',
  },
  {
    name: 'Shellfish',
    category: 'mobile-ios',
    description: 'Shellfish iOS SSH client automation',
    envPrefix: 'SHELLFISH',
    requiredEnvVars: [],
    optionalEnvVars: ['SHELLFISH_ENABLED'],
    docs: 'https://shellfishapp.com/',
  },
  {
    name: 'WorkingCopy',
    category: 'mobile-ios',
    description: 'Working Copy iOS Git client automation',
    envPrefix: 'WORKING_COPY',
    requiredEnvVars: [],
    optionalEnvVars: ['WORKING_COPY_API_KEY', 'WORKING_COPY_ENABLED'],
    docs: 'https://workingcopy.app/url-schemes.html',
  },
  {
    name: 'Pyto',
    category: 'mobile-ios',
    description: 'Pyto iOS Python IDE automation',
    envPrefix: 'PYTO',
    requiredEnvVars: [],
    optionalEnvVars: ['PYTO_ENABLED'],
    docs: 'https://pyto.app/',
  },

  // Hardware
  {
    name: 'RaspberryPi',
    category: 'hardware',
    description: 'Raspberry Pi fleet management',
    envPrefix: 'PI_FLEET',
    requiredEnvVars: [],
    optionalEnvVars: ['PI_FLEET_ENABLED', 'PI_SSH_KEY_PATH', 'PI_SSH_USER', 'PI_AGENT_PORT'],
  },

  // Productivity
  {
    name: 'Asana',
    category: 'productivity',
    description: 'Asana project and task management',
    envPrefix: 'ASANA',
    requiredEnvVars: ['ASANA_ACCESS_TOKEN'],
    optionalEnvVars: ['ASANA_ENABLED'],
    docs: 'https://developers.asana.com/docs/',
  },
  {
    name: 'Notion',
    category: 'productivity',
    description: 'Notion workspace, pages, and databases',
    envPrefix: 'NOTION',
    requiredEnvVars: ['NOTION_ACCESS_TOKEN'],
    optionalEnvVars: ['NOTION_ENABLED'],
    docs: 'https://developers.notion.com/',
  },

  // Auth & Payments
  {
    name: 'Clerk',
    category: 'auth-payments',
    description: 'Clerk authentication and user management',
    envPrefix: 'CLERK',
    requiredEnvVars: ['CLERK_API_KEY'],
    optionalEnvVars: ['CLERK_PUBLISHABLE_KEY', 'CLERK_ENABLED'],
    docs: 'https://clerk.com/docs/reference/backend-api',
  },
  {
    name: 'Stripe',
    category: 'auth-payments',
    description: 'Stripe payments, subscriptions, and billing',
    envPrefix: 'STRIPE',
    requiredEnvVars: ['STRIPE_API_KEY'],
    optionalEnvVars: ['STRIPE_WEBHOOK_SECRET', 'STRIPE_ENABLED'],
    docs: 'https://stripe.com/docs/api',
  },

  // AI & ML
  {
    name: 'HuggingFace',
    category: 'ai-ml',
    description: 'Hugging Face models, datasets, and inference',
    envPrefix: 'HUGGINGFACE',
    requiredEnvVars: ['HUGGINGFACE_API_KEY'],
    optionalEnvVars: ['HUGGINGFACE_ENABLED'],
    docs: 'https://huggingface.co/docs/api-inference',
  },
  {
    name: 'OSSModels',
    category: 'ai-ml',
    description: 'Safe, auditable open source LLM models registry',
    envPrefix: 'OSS_MODELS',
    requiredEnvVars: [],
    optionalEnvVars: ['OSS_MODELS_ENABLED'],
  },

  // Networking
  {
    name: 'Tunnels',
    category: 'networking',
    description: 'Unified tunneling (ngrok, cloudflared, localtunnel, etc.)',
    envPrefix: 'TUNNEL',
    requiredEnvVars: [],
    optionalEnvVars: [
      'TUNNEL_ENABLED',
      'NGROK_AUTH_TOKEN',
      'CLOUDFLARE_TUNNEL_TOKEN',
      'TAILSCALE_AUTH_KEY',
      'FRP_SERVER_ADDR',
      'FRP_SERVER_PORT',
      'FRP_TOKEN',
    ],
  },
];

/**
 * Get platforms by category
 */
export function getPlatformsByCategory(category: PlatformCategory): PlatformEntry[] {
  return PLATFORM_REGISTRY.filter(p => p.category === category);
}

/**
 * Get platform by name
 */
export function getPlatformByName(name: string): PlatformEntry | undefined {
  return PLATFORM_REGISTRY.find(
    p => p.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get all required environment variables for a platform
 */
export function getRequiredEnvVars(platformName: string): string[] {
  const platform = getPlatformByName(platformName);
  return platform?.requiredEnvVars || [];
}

/**
 * Check if a platform is configured
 */
export function isPlatformConfigured(platformName: string): boolean {
  const platform = getPlatformByName(platformName);
  if (!platform) return false;

  return platform.requiredEnvVars.every(envVar => !!process.env[envVar]);
}

/**
 * Get all configured platforms
 */
export function getConfiguredPlatforms(): PlatformEntry[] {
  return PLATFORM_REGISTRY.filter(p => isPlatformConfigured(p.name));
}

/**
 * Get unconfigured platforms
 */
export function getUnconfiguredPlatforms(): PlatformEntry[] {
  return PLATFORM_REGISTRY.filter(p => !isPlatformConfigured(p.name));
}

/**
 * Generate environment variable template
 */
export function generateEnvTemplate(): string {
  let template = '# BlackRoad Platform Integrations Environment Variables\n';
  template += '# Generated by BlackRoad CLI Tools\n\n';

  const categories = [...new Set(PLATFORM_REGISTRY.map(p => p.category))];

  for (const category of categories) {
    const platforms = getPlatformsByCategory(category);
    template += `# =====================\n`;
    template += `# ${category.toUpperCase().replace(/-/g, ' ')}\n`;
    template += `# =====================\n\n`;

    for (const platform of platforms) {
      template += `# ${platform.name}: ${platform.description}\n`;

      for (const envVar of platform.requiredEnvVars) {
        template += `${envVar}=\n`;
      }

      for (const envVar of platform.optionalEnvVars) {
        template += `# ${envVar}=\n`;
      }

      template += '\n';
    }
  }

  return template;
}

/**
 * Platform client factory
 */
export async function createPlatformClient<T>(
  platformName: string
): Promise<T | null> {
  const platform = getPlatformByName(platformName);
  if (!platform) {
    console.error(`Unknown platform: ${platformName}`);
    return null;
  }

  if (!isPlatformConfigured(platformName)) {
    console.error(`Platform ${platformName} is not configured. Required: ${platform.requiredEnvVars.join(', ')}`);
    return null;
  }

  // Dynamic imports would go here in a real implementation
  // For now, return null as placeholder
  return null;
}
