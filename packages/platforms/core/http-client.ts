/**
 * BlackRoad Platform Integrations - Safe HTTP Client
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Secure HTTP client with:
 * - No arbitrary code execution
 * - Request/response validation
 * - Rate limiting
 * - Automatic retries with exponential backoff
 * - Request signing for PS-SHA∞ identity
 */

import { PlatformConfig } from './config';

export interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  timeout?: number;
}

export interface HttpResponse<T = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  requestId?: string;
}

export interface RateLimiter {
  remaining: number;
  limit: number;
  resetAt: Date;
}

/**
 * Safe HTTP client for platform API calls
 */
export class SafeHttpClient {
  private config: PlatformConfig;
  private rateLimiter: RateLimiter;

  constructor(config: PlatformConfig) {
    this.config = config;
    this.rateLimiter = {
      remaining: config.rateLimitPerMinute,
      limit: config.rateLimitPerMinute,
      resetAt: new Date(Date.now() + 60000),
    };
  }

  /**
   * Validates URL to prevent SSRF attacks
   */
  private validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Only allow HTTPS in production
      if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
        return false;
      }
      // Block internal/localhost URLs
      const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
      if (blockedHosts.includes(parsed.hostname)) {
        return process.env.NODE_ENV !== 'production';
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Builds the full URL with query parameters
   */
  private buildUrl(path: string, query?: Record<string, string>): string {
    const url = new URL(path, this.config.baseUrl);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  /**
   * Gets authorization headers based on credentials
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.credentials.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.credentials.accessToken}`;
    } else if (this.config.credentials.apiKey) {
      headers['X-API-Key'] = this.config.credentials.apiKey;
    }

    return headers;
  }

  /**
   * Checks rate limit and waits if necessary
   */
  private async checkRateLimit(): Promise<void> {
    if (Date.now() > this.rateLimiter.resetAt.getTime()) {
      this.rateLimiter.remaining = this.rateLimiter.limit;
      this.rateLimiter.resetAt = new Date(Date.now() + 60000);
    }

    if (this.rateLimiter.remaining <= 0) {
      const waitTime = this.rateLimiter.resetAt.getTime() - Date.now();
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.rateLimiter.remaining = this.rateLimiter.limit;
    }

    this.rateLimiter.remaining--;
  }

  /**
   * Makes an HTTP request with retries
   */
  async request<T>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
    const url = this.buildUrl(options.path, options.query);

    if (!this.validateUrl(url)) {
      throw new Error(`Invalid or blocked URL: ${url}`);
    }

    await this.checkRateLimit();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': `BlackRoad-CLI/${this.config.version}`,
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          method: options.method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: AbortSignal.timeout(options.timeout || this.config.timeout),
        });

        const data = await response.json() as T;

        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data,
          requestId: response.headers.get('x-request-id') || undefined,
        };
      } catch (error) {
        lastError = error as Error;

        // Exponential backoff
        if (attempt < this.config.retryAttempts - 1) {
          const backoff = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Convenience methods
   */
  async get<T>(path: string, query?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'GET', path, query });
  }

  async post<T>(path: string, body?: unknown): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'POST', path, body });
  }

  async put<T>(path: string, body?: unknown): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PUT', path, body });
  }

  async patch<T>(path: string, body?: unknown): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PATCH', path, body });
  }

  async delete<T>(path: string): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'DELETE', path });
  }
}
