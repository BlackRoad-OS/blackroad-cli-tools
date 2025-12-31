/**
 * BlackRoad Platform Integration - Notion
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Notion workspace integration for:
 * - Page management
 * - Database operations
 * - Block manipulation
 * - Search functionality
 * - User and workspace management
 */

import { createPlatformConfig, SafeHttpClient, PlatformConfig } from '../core';

export type NotionColor =
  | 'default' | 'gray' | 'brown' | 'orange' | 'yellow'
  | 'green' | 'blue' | 'purple' | 'pink' | 'red'
  | 'gray_background' | 'brown_background' | 'orange_background'
  | 'yellow_background' | 'green_background' | 'blue_background'
  | 'purple_background' | 'pink_background' | 'red_background';

export interface NotionUser {
  id: string;
  type: 'person' | 'bot';
  name?: string;
  avatarUrl?: string;
  person?: {
    email: string;
  };
  bot?: {
    owner: {
      type: 'workspace' | 'user';
      workspace?: boolean;
      user?: NotionUser;
    };
  };
}

export interface NotionRichText {
  type: 'text' | 'mention' | 'equation';
  text?: {
    content: string;
    link?: { url: string };
  };
  mention?: {
    type: 'user' | 'page' | 'database' | 'date';
    user?: NotionUser;
    page?: { id: string };
    database?: { id: string };
    date?: { start: string; end?: string };
  };
  equation?: {
    expression: string;
  };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: NotionColor;
  };
  plainText?: string;
  href?: string;
}

export interface NotionPage {
  id: string;
  object: 'page';
  createdTime: string;
  lastEditedTime: string;
  createdBy: NotionUser;
  lastEditedBy: NotionUser;
  parent: {
    type: 'database_id' | 'page_id' | 'workspace';
    databaseId?: string;
    pageId?: string;
    workspace?: boolean;
  };
  archived: boolean;
  properties: Record<string, NotionProperty>;
  url: string;
  icon?: {
    type: 'emoji' | 'external' | 'file';
    emoji?: string;
    external?: { url: string };
    file?: { url: string; expiryTime: string };
  };
  cover?: {
    type: 'external' | 'file';
    external?: { url: string };
    file?: { url: string; expiryTime: string };
  };
}

export interface NotionProperty {
  id: string;
  type: string;
  title?: NotionRichText[];
  richText?: NotionRichText[];
  number?: number;
  select?: { id: string; name: string; color: NotionColor };
  multiSelect?: Array<{ id: string; name: string; color: NotionColor }>;
  date?: { start: string; end?: string; timeZone?: string };
  checkbox?: boolean;
  url?: string;
  email?: string;
  phoneNumber?: string;
  files?: Array<{
    name: string;
    type: 'external' | 'file';
    external?: { url: string };
    file?: { url: string; expiryTime: string };
  }>;
  people?: NotionUser[];
  relation?: Array<{ id: string }>;
  formula?: { type: string; string?: string; number?: number; boolean?: boolean; date?: { start: string; end?: string } };
}

export interface NotionDatabase {
  id: string;
  object: 'database';
  createdTime: string;
  lastEditedTime: string;
  title: NotionRichText[];
  description: NotionRichText[];
  icon?: NotionPage['icon'];
  cover?: NotionPage['cover'];
  properties: Record<string, NotionDatabaseProperty>;
  parent: NotionPage['parent'];
  url: string;
  archived: boolean;
  isInline: boolean;
}

export interface NotionDatabaseProperty {
  id: string;
  name: string;
  type: string;
  title?: {};
  richText?: {};
  number?: { format: string };
  select?: { options: Array<{ id: string; name: string; color: NotionColor }> };
  multiSelect?: { options: Array<{ id: string; name: string; color: NotionColor }> };
  date?: {};
  checkbox?: {};
  url?: {};
  email?: {};
  phoneNumber?: {};
  files?: {};
  people?: {};
  relation?: { databaseId: string; type: 'single_property' | 'dual_property' };
  formula?: { expression: string };
  rollup?: { relationPropertyName: string; rollupPropertyName: string; function: string };
  createdTime?: {};
  createdBy?: {};
  lastEditedTime?: {};
  lastEditedBy?: {};
}

export interface NotionBlock {
  id: string;
  object: 'block';
  type: string;
  createdTime: string;
  lastEditedTime: string;
  createdBy: NotionUser;
  lastEditedBy: NotionUser;
  parent: {
    type: 'page_id' | 'block_id' | 'database_id';
    pageId?: string;
    blockId?: string;
    databaseId?: string;
  };
  archived: boolean;
  hasChildren: boolean;
  [key: string]: unknown;
}

export interface NotionSearchResult {
  object: 'list';
  results: Array<NotionPage | NotionDatabase>;
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Notion Platform Client
 *
 * Environment Variables Required:
 * - NOTION_ACCESS_TOKEN: Integration token or OAuth token
 * - NOTION_ENABLED: Set to 'true' to enable
 */
export class NotionClient {
  private config: PlatformConfig;
  private http: SafeHttpClient;
  private notionVersion = '2022-06-28';

  constructor() {
    this.config = createPlatformConfig(
      'Notion',
      'https://api.notion.com/v1',
      'NOTION',
      { version: 'v1', rateLimitPerMinute: 300 }
    );
    this.http = new SafeHttpClient(this.config);
  }

  /**
   * Get default headers for Notion API
   */
  private getHeaders(): Record<string, string> {
    return {
      'Notion-Version': this.notionVersion,
    };
  }

  // =====================
  // Users
  // =====================

  async getCurrentUser(): Promise<NotionUser> {
    const response = await this.http.get<NotionUser>('/users/me');
    return response.data;
  }

  async getUser(userId: string): Promise<NotionUser> {
    const response = await this.http.get<NotionUser>(`/users/${userId}`);
    return response.data;
  }

  async listUsers(startCursor?: string): Promise<{ results: NotionUser[]; nextCursor?: string; hasMore: boolean }> {
    const query = startCursor ? { start_cursor: startCursor } : undefined;
    const response = await this.http.get<{ results: NotionUser[]; next_cursor?: string; has_more: boolean }>(
      '/users',
      query
    );
    return {
      results: response.data.results,
      nextCursor: response.data.next_cursor,
      hasMore: response.data.has_more,
    };
  }

  // =====================
  // Pages
  // =====================

  async getPage(pageId: string): Promise<NotionPage> {
    const response = await this.http.get<NotionPage>(`/pages/${pageId}`);
    return response.data;
  }

  async createPage(options: {
    parent: { databaseId: string } | { pageId: string };
    properties: Record<string, unknown>;
    children?: NotionBlock[];
    icon?: NotionPage['icon'];
    cover?: NotionPage['cover'];
  }): Promise<NotionPage> {
    const body: Record<string, unknown> = {
      parent: 'databaseId' in options.parent
        ? { database_id: options.parent.databaseId }
        : { page_id: options.parent.pageId },
      properties: options.properties,
    };

    if (options.children) body.children = options.children;
    if (options.icon) body.icon = options.icon;
    if (options.cover) body.cover = options.cover;

    const response = await this.http.post<NotionPage>('/pages', body);
    return response.data;
  }

  async updatePage(pageId: string, options: {
    properties?: Record<string, unknown>;
    icon?: NotionPage['icon'];
    cover?: NotionPage['cover'];
    archived?: boolean;
  }): Promise<NotionPage> {
    const response = await this.http.patch<NotionPage>(`/pages/${pageId}`, options);
    return response.data;
  }

  async archivePage(pageId: string): Promise<NotionPage> {
    return this.updatePage(pageId, { archived: true });
  }

  // =====================
  // Databases
  // =====================

  async getDatabase(databaseId: string): Promise<NotionDatabase> {
    const response = await this.http.get<NotionDatabase>(`/databases/${databaseId}`);
    return response.data;
  }

  async queryDatabase(databaseId: string, options?: {
    filter?: Record<string, unknown>;
    sorts?: Array<{ property: string; direction: 'ascending' | 'descending' } | { timestamp: 'created_time' | 'last_edited_time'; direction: 'ascending' | 'descending' }>;
    startCursor?: string;
    pageSize?: number;
  }): Promise<{ results: NotionPage[]; nextCursor?: string; hasMore: boolean }> {
    const body: Record<string, unknown> = {};

    if (options?.filter) body.filter = options.filter;
    if (options?.sorts) body.sorts = options.sorts;
    if (options?.startCursor) body.start_cursor = options.startCursor;
    if (options?.pageSize) body.page_size = options.pageSize;

    const response = await this.http.post<{ results: NotionPage[]; next_cursor?: string; has_more: boolean }>(
      `/databases/${databaseId}/query`,
      body
    );

    return {
      results: response.data.results,
      nextCursor: response.data.next_cursor,
      hasMore: response.data.has_more,
    };
  }

  async createDatabase(options: {
    parent: { pageId: string };
    title: NotionRichText[];
    properties: Record<string, NotionDatabaseProperty>;
    icon?: NotionPage['icon'];
    cover?: NotionPage['cover'];
    isInline?: boolean;
  }): Promise<NotionDatabase> {
    const response = await this.http.post<NotionDatabase>('/databases', {
      parent: { page_id: options.parent.pageId },
      title: options.title,
      properties: options.properties,
      icon: options.icon,
      cover: options.cover,
      is_inline: options.isInline,
    });
    return response.data;
  }

  async updateDatabase(databaseId: string, options: {
    title?: NotionRichText[];
    description?: NotionRichText[];
    properties?: Record<string, NotionDatabaseProperty | null>;
    icon?: NotionPage['icon'];
    cover?: NotionPage['cover'];
    archived?: boolean;
  }): Promise<NotionDatabase> {
    const response = await this.http.patch<NotionDatabase>(`/databases/${databaseId}`, options);
    return response.data;
  }

  // =====================
  // Blocks
  // =====================

  async getBlock(blockId: string): Promise<NotionBlock> {
    const response = await this.http.get<NotionBlock>(`/blocks/${blockId}`);
    return response.data;
  }

  async getBlockChildren(blockId: string, startCursor?: string): Promise<{ results: NotionBlock[]; nextCursor?: string; hasMore: boolean }> {
    const query = startCursor ? { start_cursor: startCursor } : undefined;
    const response = await this.http.get<{ results: NotionBlock[]; next_cursor?: string; has_more: boolean }>(
      `/blocks/${blockId}/children`,
      query
    );
    return {
      results: response.data.results,
      nextCursor: response.data.next_cursor,
      hasMore: response.data.has_more,
    };
  }

  async appendBlockChildren(blockId: string, children: NotionBlock[]): Promise<{ results: NotionBlock[] }> {
    const response = await this.http.patch<{ results: NotionBlock[] }>(
      `/blocks/${blockId}/children`,
      { children }
    );
    return response.data;
  }

  async updateBlock(blockId: string, block: Partial<NotionBlock>): Promise<NotionBlock> {
    const response = await this.http.patch<NotionBlock>(`/blocks/${blockId}`, block);
    return response.data;
  }

  async deleteBlock(blockId: string): Promise<NotionBlock> {
    const response = await this.http.delete<NotionBlock>(`/blocks/${blockId}`);
    return response.data;
  }

  // =====================
  // Search
  // =====================

  async search(options?: {
    query?: string;
    filter?: { property: 'object'; value: 'page' | 'database' };
    sort?: { direction: 'ascending' | 'descending'; timestamp: 'last_edited_time' };
    startCursor?: string;
    pageSize?: number;
  }): Promise<NotionSearchResult> {
    const body: Record<string, unknown> = {};

    if (options?.query) body.query = options.query;
    if (options?.filter) body.filter = options.filter;
    if (options?.sort) body.sort = options.sort;
    if (options?.startCursor) body.start_cursor = options.startCursor;
    if (options?.pageSize) body.page_size = options.pageSize;

    const response = await this.http.post<NotionSearchResult>('/search', body);
    return response.data;
  }

  // =====================
  // Helper Methods
  // =====================

  /**
   * Create a simple text rich text object
   */
  createRichText(text: string, options?: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    color?: NotionColor;
    link?: string;
  }): NotionRichText {
    return {
      type: 'text',
      text: {
        content: text,
        link: options?.link ? { url: options.link } : undefined,
      },
      annotations: {
        bold: options?.bold,
        italic: options?.italic,
        code: options?.code,
        color: options?.color,
      },
    };
  }

  /**
   * Create a paragraph block
   */
  createParagraphBlock(text: string | NotionRichText[]): Partial<NotionBlock> {
    const richText = typeof text === 'string' ? [this.createRichText(text)] : text;
    return {
      type: 'paragraph',
      paragraph: {
        rich_text: richText,
      },
    } as Partial<NotionBlock>;
  }

  /**
   * Create a heading block
   */
  createHeadingBlock(text: string, level: 1 | 2 | 3): Partial<NotionBlock> {
    const blockType = `heading_${level}` as const;
    return {
      type: blockType,
      [blockType]: {
        rich_text: [this.createRichText(text)],
      },
    } as Partial<NotionBlock>;
  }

  /**
   * Create a to-do block
   */
  createTodoBlock(text: string, checked: boolean = false): Partial<NotionBlock> {
    return {
      type: 'to_do',
      to_do: {
        rich_text: [this.createRichText(text)],
        checked,
      },
    } as Partial<NotionBlock>;
  }

  /**
   * Create a bulleted list item block
   */
  createBulletedListBlock(text: string): Partial<NotionBlock> {
    return {
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [this.createRichText(text)],
      },
    } as Partial<NotionBlock>;
  }
}

export default NotionClient;
