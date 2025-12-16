/**
 * BlackRoad Platform Integration - Clerk
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Clerk authentication integration for:
 * - User management
 * - Organization management
 * - Session management
 * - JWT verification
 * - Webhook handling
 */

import { createPlatformConfig, SafeHttpClient, PlatformConfig } from '../core';

export interface ClerkUser {
  id: string;
  object: 'user';
  username?: string;
  firstName?: string;
  lastName?: string;
  imageUrl: string;
  hasImage: boolean;
  primaryEmailAddressId?: string;
  primaryPhoneNumberId?: string;
  primaryWeb3WalletId?: string;
  passwordEnabled: boolean;
  twoFactorEnabled: boolean;
  totp_enabled: boolean;
  backupCodeEnabled: boolean;
  emailAddresses: ClerkEmailAddress[];
  phoneNumbers: ClerkPhoneNumber[];
  web3Wallets: ClerkWeb3Wallet[];
  externalAccounts: ClerkExternalAccount[];
  publicMetadata: Record<string, unknown>;
  privateMetadata: Record<string, unknown>;
  unsafeMetadata: Record<string, unknown>;
  lastSignInAt?: number;
  banned: boolean;
  locked: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ClerkEmailAddress {
  id: string;
  object: 'email_address';
  emailAddress: string;
  verification: ClerkVerification;
  linkedTo: Array<{ id: string; type: string }>;
}

export interface ClerkPhoneNumber {
  id: string;
  object: 'phone_number';
  phoneNumber: string;
  verification: ClerkVerification;
  linkedTo: Array<{ id: string; type: string }>;
}

export interface ClerkWeb3Wallet {
  id: string;
  object: 'web3_wallet';
  web3Wallet: string;
  verification: ClerkVerification;
}

export interface ClerkVerification {
  status: 'unverified' | 'verified' | 'transferable' | 'failed' | 'expired';
  strategy: string;
  attempts?: number;
  expireAt?: number;
}

export interface ClerkExternalAccount {
  id: string;
  object: 'external_account';
  provider: string;
  identificationId: string;
  providerUserId: string;
  approvedScopes: string;
  emailAddress: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  username?: string;
  verification: ClerkVerification;
}

export interface ClerkOrganization {
  id: string;
  object: 'organization';
  name: string;
  slug: string;
  imageUrl: string;
  hasImage: boolean;
  membersCount: number;
  pendingInvitationsCount: number;
  maxAllowedMemberships: number;
  adminDeleteEnabled: boolean;
  publicMetadata: Record<string, unknown>;
  privateMetadata: Record<string, unknown>;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface ClerkOrganizationMembership {
  id: string;
  object: 'organization_membership';
  organization: ClerkOrganization;
  publicUserData: {
    userId: string;
    firstName?: string;
    lastName?: string;
    imageUrl: string;
    hasImage: boolean;
    identifier: string;
  };
  role: string;
  publicMetadata: Record<string, unknown>;
  privateMetadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface ClerkInvitation {
  id: string;
  object: 'invitation';
  emailAddress: string;
  publicMetadata: Record<string, unknown>;
  revoked: boolean;
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: number;
  updatedAt: number;
}

export interface ClerkSession {
  id: string;
  object: 'session';
  userId: string;
  clientId: string;
  status: 'active' | 'revoked' | 'ended' | 'expired' | 'removed' | 'abandoned';
  lastActiveAt: number;
  expireAt: number;
  abandonAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface ClerkJWTClaims {
  azp?: string;
  exp: number;
  iat: number;
  iss: string;
  nbf: number;
  sid: string;
  sub: string;
  act?: {
    sub: string;
  };
}

/**
 * Clerk Authentication Client
 *
 * Environment Variables Required:
 * - CLERK_API_KEY: Clerk Backend API key (sk_...)
 * - CLERK_PUBLISHABLE_KEY: Clerk publishable key (pk_...)
 * - CLERK_ENABLED: Set to 'true' to enable
 */
export class ClerkClient {
  private config: PlatformConfig;
  private http: SafeHttpClient;

  constructor() {
    this.config = createPlatformConfig(
      'Clerk',
      'https://api.clerk.com/v1',
      'CLERK',
      { version: 'v1', rateLimitPerMinute: 500 }
    );
    this.http = new SafeHttpClient(this.config);
  }

  // =====================
  // Users
  // =====================

  async listUsers(options?: {
    limit?: number;
    offset?: number;
    orderBy?: 'created_at' | 'updated_at';
    emailAddress?: string[];
    phoneNumber?: string[];
    username?: string[];
    web3Wallet?: string[];
    userId?: string[];
  }): Promise<ClerkUser[]> {
    const query: Record<string, string> = {};

    if (options?.limit) query.limit = String(options.limit);
    if (options?.offset) query.offset = String(options.offset);
    if (options?.orderBy) query.order_by = options.orderBy;
    if (options?.emailAddress) query.email_address = options.emailAddress.join(',');
    if (options?.phoneNumber) query.phone_number = options.phoneNumber.join(',');
    if (options?.username) query.username = options.username.join(',');
    if (options?.web3Wallet) query.web3_wallet = options.web3Wallet.join(',');
    if (options?.userId) query.user_id = options.userId.join(',');

    const response = await this.http.get<ClerkUser[]>('/users', query);
    return response.data;
  }

  async getUser(userId: string): Promise<ClerkUser> {
    const response = await this.http.get<ClerkUser>(`/users/${userId}`);
    return response.data;
  }

  async createUser(options: {
    emailAddress?: string[];
    phoneNumber?: string[];
    username?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    publicMetadata?: Record<string, unknown>;
    privateMetadata?: Record<string, unknown>;
    unsafeMetadata?: Record<string, unknown>;
    skipPasswordChecks?: boolean;
    skipPasswordRequirement?: boolean;
  }): Promise<ClerkUser> {
    const response = await this.http.post<ClerkUser>('/users', {
      email_address: options.emailAddress,
      phone_number: options.phoneNumber,
      username: options.username,
      password: options.password,
      first_name: options.firstName,
      last_name: options.lastName,
      public_metadata: options.publicMetadata,
      private_metadata: options.privateMetadata,
      unsafe_metadata: options.unsafeMetadata,
      skip_password_checks: options.skipPasswordChecks,
      skip_password_requirement: options.skipPasswordRequirement,
    });
    return response.data;
  }

  async updateUser(userId: string, options: Partial<{
    username: string;
    firstName: string;
    lastName: string;
    primaryEmailAddressId: string;
    primaryPhoneNumberId: string;
    primaryWeb3WalletId: string;
    publicMetadata: Record<string, unknown>;
    privateMetadata: Record<string, unknown>;
    unsafeMetadata: Record<string, unknown>;
    profileImageId: string;
    password: string;
  }>): Promise<ClerkUser> {
    const response = await this.http.patch<ClerkUser>(`/users/${userId}`, {
      username: options.username,
      first_name: options.firstName,
      last_name: options.lastName,
      primary_email_address_id: options.primaryEmailAddressId,
      primary_phone_number_id: options.primaryPhoneNumberId,
      primary_web3_wallet_id: options.primaryWeb3WalletId,
      public_metadata: options.publicMetadata,
      private_metadata: options.privateMetadata,
      unsafe_metadata: options.unsafeMetadata,
      profile_image_id: options.profileImageId,
      password: options.password,
    });
    return response.data;
  }

  async deleteUser(userId: string): Promise<{ id: string; object: 'user'; deleted: boolean }> {
    const response = await this.http.delete<{ id: string; object: 'user'; deleted: boolean }>(
      `/users/${userId}`
    );
    return response.data;
  }

  async banUser(userId: string): Promise<ClerkUser> {
    const response = await this.http.post<ClerkUser>(`/users/${userId}/ban`);
    return response.data;
  }

  async unbanUser(userId: string): Promise<ClerkUser> {
    const response = await this.http.post<ClerkUser>(`/users/${userId}/unban`);
    return response.data;
  }

  async lockUser(userId: string): Promise<ClerkUser> {
    const response = await this.http.post<ClerkUser>(`/users/${userId}/lock`);
    return response.data;
  }

  async unlockUser(userId: string): Promise<ClerkUser> {
    const response = await this.http.post<ClerkUser>(`/users/${userId}/unlock`);
    return response.data;
  }

  // =====================
  // Organizations
  // =====================

  async listOrganizations(options?: {
    limit?: number;
    offset?: number;
    includeMembersCount?: boolean;
    query?: string;
    orderBy?: string;
  }): Promise<{ data: ClerkOrganization[]; totalCount: number }> {
    const query_params: Record<string, string> = {};

    if (options?.limit) query_params.limit = String(options.limit);
    if (options?.offset) query_params.offset = String(options.offset);
    if (options?.includeMembersCount) query_params.include_members_count = 'true';
    if (options?.query) query_params.query = options.query;
    if (options?.orderBy) query_params.order_by = options.orderBy;

    const response = await this.http.get<{ data: ClerkOrganization[]; total_count: number }>(
      '/organizations',
      query_params
    );
    return { data: response.data.data, totalCount: response.data.total_count };
  }

  async getOrganization(organizationId: string): Promise<ClerkOrganization> {
    const response = await this.http.get<ClerkOrganization>(`/organizations/${organizationId}`);
    return response.data;
  }

  async createOrganization(options: {
    name: string;
    slug?: string;
    createdBy: string;
    maxAllowedMemberships?: number;
    publicMetadata?: Record<string, unknown>;
    privateMetadata?: Record<string, unknown>;
  }): Promise<ClerkOrganization> {
    const response = await this.http.post<ClerkOrganization>('/organizations', {
      name: options.name,
      slug: options.slug,
      created_by: options.createdBy,
      max_allowed_memberships: options.maxAllowedMemberships,
      public_metadata: options.publicMetadata,
      private_metadata: options.privateMetadata,
    });
    return response.data;
  }

  async updateOrganization(organizationId: string, options: Partial<{
    name: string;
    slug: string;
    maxAllowedMemberships: number;
    adminDeleteEnabled: boolean;
    publicMetadata: Record<string, unknown>;
    privateMetadata: Record<string, unknown>;
  }>): Promise<ClerkOrganization> {
    const response = await this.http.patch<ClerkOrganization>(`/organizations/${organizationId}`, {
      name: options.name,
      slug: options.slug,
      max_allowed_memberships: options.maxAllowedMemberships,
      admin_delete_enabled: options.adminDeleteEnabled,
      public_metadata: options.publicMetadata,
      private_metadata: options.privateMetadata,
    });
    return response.data;
  }

  async deleteOrganization(organizationId: string): Promise<{ id: string; object: 'organization'; deleted: boolean }> {
    const response = await this.http.delete<{ id: string; object: 'organization'; deleted: boolean }>(
      `/organizations/${organizationId}`
    );
    return response.data;
  }

  // =====================
  // Organization Memberships
  // =====================

  async listOrganizationMemberships(organizationId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ data: ClerkOrganizationMembership[]; totalCount: number }> {
    const query: Record<string, string> = {};

    if (options?.limit) query.limit = String(options.limit);
    if (options?.offset) query.offset = String(options.offset);

    const response = await this.http.get<{ data: ClerkOrganizationMembership[]; total_count: number }>(
      `/organizations/${organizationId}/memberships`,
      query
    );
    return { data: response.data.data, totalCount: response.data.total_count };
  }

  async createOrganizationMembership(organizationId: string, userId: string, role: string): Promise<ClerkOrganizationMembership> {
    const response = await this.http.post<ClerkOrganizationMembership>(
      `/organizations/${organizationId}/memberships`,
      { user_id: userId, role }
    );
    return response.data;
  }

  async updateOrganizationMembership(organizationId: string, userId: string, role: string): Promise<ClerkOrganizationMembership> {
    const response = await this.http.patch<ClerkOrganizationMembership>(
      `/organizations/${organizationId}/memberships/${userId}`,
      { role }
    );
    return response.data;
  }

  async deleteOrganizationMembership(organizationId: string, userId: string): Promise<ClerkOrganizationMembership> {
    const response = await this.http.delete<ClerkOrganizationMembership>(
      `/organizations/${organizationId}/memberships/${userId}`
    );
    return response.data;
  }

  // =====================
  // Invitations
  // =====================

  async listInvitations(options?: {
    limit?: number;
    offset?: number;
    status?: 'pending' | 'accepted' | 'revoked';
  }): Promise<{ data: ClerkInvitation[]; totalCount: number }> {
    const query: Record<string, string> = {};

    if (options?.limit) query.limit = String(options.limit);
    if (options?.offset) query.offset = String(options.offset);
    if (options?.status) query.status = options.status;

    const response = await this.http.get<{ data: ClerkInvitation[]; total_count: number }>(
      '/invitations',
      query
    );
    return { data: response.data.data, totalCount: response.data.total_count };
  }

  async createInvitation(emailAddress: string, options?: {
    publicMetadata?: Record<string, unknown>;
    redirectUrl?: string;
  }): Promise<ClerkInvitation> {
    const response = await this.http.post<ClerkInvitation>('/invitations', {
      email_address: emailAddress,
      public_metadata: options?.publicMetadata,
      redirect_url: options?.redirectUrl,
    });
    return response.data;
  }

  async revokeInvitation(invitationId: string): Promise<ClerkInvitation> {
    const response = await this.http.post<ClerkInvitation>(`/invitations/${invitationId}/revoke`);
    return response.data;
  }

  // =====================
  // Sessions
  // =====================

  async listSessions(options?: {
    clientId?: string;
    userId?: string;
    status?: ClerkSession['status'];
    limit?: number;
    offset?: number;
  }): Promise<ClerkSession[]> {
    const query: Record<string, string> = {};

    if (options?.clientId) query.client_id = options.clientId;
    if (options?.userId) query.user_id = options.userId;
    if (options?.status) query.status = options.status;
    if (options?.limit) query.limit = String(options.limit);
    if (options?.offset) query.offset = String(options.offset);

    const response = await this.http.get<ClerkSession[]>('/sessions', query);
    return response.data;
  }

  async getSession(sessionId: string): Promise<ClerkSession> {
    const response = await this.http.get<ClerkSession>(`/sessions/${sessionId}`);
    return response.data;
  }

  async revokeSession(sessionId: string): Promise<ClerkSession> {
    const response = await this.http.post<ClerkSession>(`/sessions/${sessionId}/revoke`);
    return response.data;
  }

  // =====================
  // JWT Verification (Helper)
  // =====================

  /**
   * Verify a JWT token
   * Note: In production, use the official Clerk SDK for proper verification
   */
  async verifyToken(token: string): Promise<ClerkJWTClaims> {
    const response = await this.http.post<ClerkJWTClaims>('/tokens/verify', {
      token,
    });
    return response.data;
  }
}

export default ClerkClient;
