/**
 * BlackRoad Platform Integrations - Core Configuration
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Safe, auditable configuration management for all platform integrations.
 * No sensitive data is hardcoded - all credentials from environment variables.
 */

export interface PlatformCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookSecret?: string;
}

export interface PlatformConfig {
  name: string;
  enabled: boolean;
  baseUrl: string;
  version: string;
  credentials: PlatformCredentials;
  timeout: number;
  retryAttempts: number;
  rateLimitPerMinute: number;
}

/**
 * Safely retrieves environment variables without exposing defaults
 */
export function getEnvVar(key: string, required: boolean = false): string | undefined {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Creates a platform configuration with secure defaults
 */
export function createPlatformConfig(
  name: string,
  baseUrl: string,
  envPrefix: string,
  options: Partial<PlatformConfig> = {}
): PlatformConfig {
  return {
    name,
    enabled: getEnvVar(`${envPrefix}_ENABLED`) === 'true',
    baseUrl,
    version: options.version || 'v1',
    credentials: {
      apiKey: getEnvVar(`${envPrefix}_API_KEY`),
      apiSecret: getEnvVar(`${envPrefix}_API_SECRET`),
      accessToken: getEnvVar(`${envPrefix}_ACCESS_TOKEN`),
      refreshToken: getEnvVar(`${envPrefix}_REFRESH_TOKEN`),
      webhookSecret: getEnvVar(`${envPrefix}_WEBHOOK_SECRET`),
    },
    timeout: options.timeout || 30000,
    retryAttempts: options.retryAttempts || 3,
    rateLimitPerMinute: options.rateLimitPerMinute || 60,
  };
}

/**
 * Validates that a configuration has required credentials
 */
export function validateCredentials(
  config: PlatformConfig,
  required: (keyof PlatformCredentials)[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const key of required) {
    if (!config.credentials[key]) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Sanitizes configuration for logging (removes sensitive data)
 */
export function sanitizeConfigForLogging(config: PlatformConfig): object {
  return {
    name: config.name,
    enabled: config.enabled,
    baseUrl: config.baseUrl,
    version: config.version,
    timeout: config.timeout,
    retryAttempts: config.retryAttempts,
    rateLimitPerMinute: config.rateLimitPerMinute,
    credentials: {
      apiKey: config.credentials.apiKey ? '[REDACTED]' : undefined,
      apiSecret: config.credentials.apiSecret ? '[REDACTED]' : undefined,
      accessToken: config.credentials.accessToken ? '[REDACTED]' : undefined,
      refreshToken: config.credentials.refreshToken ? '[REDACTED]' : undefined,
      webhookSecret: config.credentials.webhookSecret ? '[REDACTED]' : undefined,
    },
  };
}
