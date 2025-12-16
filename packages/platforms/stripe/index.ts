/**
 * BlackRoad Platform Integration - Stripe
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Stripe payments integration for:
 * - Customer management
 * - Payment processing
 * - Subscription management
 * - Invoice management
 * - Webhook handling
 */

import { createPlatformConfig, SafeHttpClient, PlatformConfig } from '../core';

export interface StripeCustomer {
  id: string;
  object: 'customer';
  address?: StripeAddress;
  balance: number;
  created: number;
  currency?: string;
  defaultSource?: string;
  delinquent: boolean;
  description?: string;
  discount?: StripeDiscount;
  email?: string;
  invoicePrefix?: string;
  invoiceSettings: {
    customFields?: Array<{ name: string; value: string }>;
    defaultPaymentMethod?: string;
    footer?: string;
    renderingOptions?: {
      amountTaxDisplay?: 'exclude_tax' | 'include_inclusive_tax';
    };
  };
  livemode: boolean;
  metadata: Record<string, string>;
  name?: string;
  phone?: string;
  preferredLocales?: string[];
  shipping?: StripeShipping;
  taxExempt?: 'none' | 'exempt' | 'reverse';
}

export interface StripeAddress {
  city?: string;
  country?: string;
  line1?: string;
  line2?: string;
  postalCode?: string;
  state?: string;
}

export interface StripeShipping {
  address: StripeAddress;
  name: string;
  phone?: string;
}

export interface StripeDiscount {
  id: string;
  coupon: StripeCoupon;
  customer?: string;
  end?: number;
  start: number;
  subscription?: string;
}

export interface StripeCoupon {
  id: string;
  object: 'coupon';
  amountOff?: number;
  currency?: string;
  duration: 'forever' | 'once' | 'repeating';
  durationInMonths?: number;
  livemode: boolean;
  maxRedemptions?: number;
  metadata: Record<string, string>;
  name?: string;
  percentOff?: number;
  timesRedeemed: number;
  valid: boolean;
}

export interface StripeProduct {
  id: string;
  object: 'product';
  active: boolean;
  created: number;
  description?: string;
  images: string[];
  livemode: boolean;
  metadata: Record<string, string>;
  name: string;
  packageDimensions?: {
    height: number;
    length: number;
    weight: number;
    width: number;
  };
  shippable?: boolean;
  statementDescriptor?: string;
  taxCode?: string;
  type: 'good' | 'service';
  unitLabel?: string;
  updated: number;
  url?: string;
}

export interface StripePrice {
  id: string;
  object: 'price';
  active: boolean;
  billingScheme: 'per_unit' | 'tiered';
  created: number;
  currency: string;
  livemode: boolean;
  lookupKey?: string;
  metadata: Record<string, string>;
  nickname?: string;
  product: string | StripeProduct;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount: number;
    trialPeriodDays?: number;
    usageType: 'metered' | 'licensed';
  };
  taxBehavior?: 'exclusive' | 'inclusive' | 'unspecified';
  type: 'one_time' | 'recurring';
  unitAmount?: number;
  unitAmountDecimal?: string;
}

export interface StripeSubscription {
  id: string;
  object: 'subscription';
  applicationFeePercent?: number;
  automaticTax: { enabled: boolean };
  billingCycleAnchor: number;
  billingThresholds?: {
    amountGte?: number;
    resetBillingCycleAnchor?: boolean;
  };
  cancelAt?: number;
  cancelAtPeriodEnd: boolean;
  canceledAt?: number;
  collectionMethod: 'charge_automatically' | 'send_invoice';
  created: number;
  currency: string;
  currentPeriodEnd: number;
  currentPeriodStart: number;
  customer: string;
  daysUntilDue?: number;
  defaultPaymentMethod?: string;
  defaultSource?: string;
  description?: string;
  discount?: StripeDiscount;
  endedAt?: number;
  items: {
    object: 'list';
    data: Array<{
      id: string;
      price: StripePrice;
      quantity?: number;
    }>;
  };
  latestInvoice?: string;
  livemode: boolean;
  metadata: Record<string, string>;
  pendingSetupIntent?: string;
  pendingUpdate?: unknown;
  schedule?: string;
  startDate: number;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'paused' | 'trialing' | 'unpaid';
  trialEnd?: number;
  trialStart?: number;
}

export interface StripePaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  amountCapturable: number;
  amountReceived: number;
  application?: string;
  applicationFeeAmount?: number;
  automaticPaymentMethods?: { enabled: boolean };
  canceledAt?: number;
  cancellationReason?: string;
  captureMethod: 'automatic' | 'manual';
  clientSecret: string;
  confirmationMethod: 'automatic' | 'manual';
  created: number;
  currency: string;
  customer?: string;
  description?: string;
  invoice?: string;
  lastPaymentError?: {
    code: string;
    message: string;
    type: string;
  };
  livemode: boolean;
  metadata: Record<string, string>;
  paymentMethod?: string;
  paymentMethodTypes: string[];
  receiptEmail?: string;
  setupFutureUsage?: 'off_session' | 'on_session';
  shipping?: StripeShipping;
  statementDescriptor?: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
}

export interface StripeInvoice {
  id: string;
  object: 'invoice';
  accountCountry?: string;
  accountName?: string;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  attemptCount: number;
  attempted: boolean;
  autoAdvance?: boolean;
  billingReason?: string;
  collectionMethod: 'charge_automatically' | 'send_invoice';
  created: number;
  currency: string;
  customer: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  dueDate?: number;
  endingBalance?: number;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  livemode: boolean;
  metadata: Record<string, string>;
  number?: string;
  paid: boolean;
  paidOutOfBand: boolean;
  periodEnd: number;
  periodStart: number;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  subscription?: string;
  subtotal: number;
  tax?: number;
  total: number;
}

/**
 * Stripe Payments Client
 *
 * Environment Variables Required:
 * - STRIPE_API_KEY: Stripe secret key (sk_...)
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret (whsec_...)
 * - STRIPE_ENABLED: Set to 'true' to enable
 */
export class StripeClient {
  private config: PlatformConfig;
  private http: SafeHttpClient;

  constructor() {
    this.config = createPlatformConfig(
      'Stripe',
      'https://api.stripe.com/v1',
      'STRIPE',
      { version: 'v1', rateLimitPerMinute: 100 }
    );
    this.http = new SafeHttpClient(this.config);
  }

  /**
   * Convert object to form-urlencoded format for Stripe API
   */
  private toFormData(obj: Record<string, unknown>, prefix?: string): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}[${key}]` : key;

      if (value === undefined || value === null) {
        continue;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.toFormData(value as Record<string, unknown>, fullKey));
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            Object.assign(result, this.toFormData(item as Record<string, unknown>, `${fullKey}[${index}]`));
          } else {
            result[`${fullKey}[${index}]`] = String(item);
          }
        });
      } else {
        result[fullKey] = String(value);
      }
    }

    return result;
  }

  // =====================
  // Customers
  // =====================

  async listCustomers(options?: {
    email?: string;
    limit?: number;
    startingAfter?: string;
  }): Promise<{ data: StripeCustomer[]; hasMore: boolean }> {
    const query: Record<string, string> = {};

    if (options?.email) query.email = options.email;
    if (options?.limit) query.limit = String(options.limit);
    if (options?.startingAfter) query.starting_after = options.startingAfter;

    const response = await this.http.get<{ data: StripeCustomer[]; has_more: boolean }>('/customers', query);
    return { data: response.data.data, hasMore: response.data.has_more };
  }

  async getCustomer(customerId: string): Promise<StripeCustomer> {
    const response = await this.http.get<StripeCustomer>(`/customers/${customerId}`);
    return response.data;
  }

  async createCustomer(options: {
    email?: string;
    name?: string;
    phone?: string;
    description?: string;
    address?: StripeAddress;
    shipping?: StripeShipping;
    metadata?: Record<string, string>;
    paymentMethod?: string;
  }): Promise<StripeCustomer> {
    const response = await this.http.post<StripeCustomer>('/customers', options);
    return response.data;
  }

  async updateCustomer(customerId: string, options: Partial<{
    email: string;
    name: string;
    phone: string;
    description: string;
    address: StripeAddress;
    shipping: StripeShipping;
    metadata: Record<string, string>;
    defaultSource: string;
  }>): Promise<StripeCustomer> {
    const response = await this.http.post<StripeCustomer>(`/customers/${customerId}`, options);
    return response.data;
  }

  async deleteCustomer(customerId: string): Promise<{ id: string; object: 'customer'; deleted: boolean }> {
    const response = await this.http.delete<{ id: string; object: 'customer'; deleted: boolean }>(
      `/customers/${customerId}`
    );
    return response.data;
  }

  // =====================
  // Products
  // =====================

  async listProducts(options?: { active?: boolean; limit?: number }): Promise<{ data: StripeProduct[]; hasMore: boolean }> {
    const query: Record<string, string> = {};

    if (options?.active !== undefined) query.active = String(options.active);
    if (options?.limit) query.limit = String(options.limit);

    const response = await this.http.get<{ data: StripeProduct[]; has_more: boolean }>('/products', query);
    return { data: response.data.data, hasMore: response.data.has_more };
  }

  async getProduct(productId: string): Promise<StripeProduct> {
    const response = await this.http.get<StripeProduct>(`/products/${productId}`);
    return response.data;
  }

  async createProduct(options: {
    name: string;
    description?: string;
    images?: string[];
    metadata?: Record<string, string>;
    shippable?: boolean;
    statementDescriptor?: string;
    taxCode?: string;
    unitLabel?: string;
    url?: string;
  }): Promise<StripeProduct> {
    const response = await this.http.post<StripeProduct>('/products', options);
    return response.data;
  }

  // =====================
  // Prices
  // =====================

  async listPrices(options?: { product?: string; active?: boolean; limit?: number }): Promise<{ data: StripePrice[]; hasMore: boolean }> {
    const query: Record<string, string> = {};

    if (options?.product) query.product = options.product;
    if (options?.active !== undefined) query.active = String(options.active);
    if (options?.limit) query.limit = String(options.limit);

    const response = await this.http.get<{ data: StripePrice[]; has_more: boolean }>('/prices', query);
    return { data: response.data.data, hasMore: response.data.has_more };
  }

  async getPrice(priceId: string): Promise<StripePrice> {
    const response = await this.http.get<StripePrice>(`/prices/${priceId}`);
    return response.data;
  }

  async createPrice(options: {
    product: string;
    currency: string;
    unitAmount?: number;
    recurring?: {
      interval: 'day' | 'week' | 'month' | 'year';
      intervalCount?: number;
      trialPeriodDays?: number;
      usageType?: 'metered' | 'licensed';
    };
    billingScheme?: 'per_unit' | 'tiered';
    lookupKey?: string;
    nickname?: string;
    metadata?: Record<string, string>;
  }): Promise<StripePrice> {
    const response = await this.http.post<StripePrice>('/prices', options);
    return response.data;
  }

  // =====================
  // Subscriptions
  // =====================

  async listSubscriptions(options?: {
    customer?: string;
    status?: StripeSubscription['status'];
    limit?: number;
  }): Promise<{ data: StripeSubscription[]; hasMore: boolean }> {
    const query: Record<string, string> = {};

    if (options?.customer) query.customer = options.customer;
    if (options?.status) query.status = options.status;
    if (options?.limit) query.limit = String(options.limit);

    const response = await this.http.get<{ data: StripeSubscription[]; has_more: boolean }>('/subscriptions', query);
    return { data: response.data.data, hasMore: response.data.has_more };
  }

  async getSubscription(subscriptionId: string): Promise<StripeSubscription> {
    const response = await this.http.get<StripeSubscription>(`/subscriptions/${subscriptionId}`);
    return response.data;
  }

  async createSubscription(options: {
    customer: string;
    items: Array<{ price: string; quantity?: number }>;
    defaultPaymentMethod?: string;
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
    cancelAtPeriodEnd?: boolean;
  }): Promise<StripeSubscription> {
    const response = await this.http.post<StripeSubscription>('/subscriptions', options);
    return response.data;
  }

  async updateSubscription(subscriptionId: string, options: Partial<{
    items: Array<{ id?: string; price: string; quantity?: number; deleted?: boolean }>;
    defaultPaymentMethod: string;
    cancelAtPeriodEnd: boolean;
    metadata: Record<string, string>;
    prorationBehavior: 'create_prorations' | 'none' | 'always_invoice';
  }>): Promise<StripeSubscription> {
    const response = await this.http.post<StripeSubscription>(`/subscriptions/${subscriptionId}`, options);
    return response.data;
  }

  async cancelSubscription(subscriptionId: string, options?: {
    invoiceNow?: boolean;
    prorate?: boolean;
  }): Promise<StripeSubscription> {
    const response = await this.http.delete<StripeSubscription>(`/subscriptions/${subscriptionId}`);
    return response.data;
  }

  // =====================
  // Payment Intents
  // =====================

  async createPaymentIntent(options: {
    amount: number;
    currency: string;
    customer?: string;
    description?: string;
    metadata?: Record<string, string>;
    paymentMethodTypes?: string[];
    receiptEmail?: string;
    setupFutureUsage?: 'off_session' | 'on_session';
  }): Promise<StripePaymentIntent> {
    const response = await this.http.post<StripePaymentIntent>('/payment_intents', options);
    return response.data;
  }

  async getPaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    const response = await this.http.get<StripePaymentIntent>(`/payment_intents/${paymentIntentId}`);
    return response.data;
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethod?: string): Promise<StripePaymentIntent> {
    const response = await this.http.post<StripePaymentIntent>(
      `/payment_intents/${paymentIntentId}/confirm`,
      paymentMethod ? { payment_method: paymentMethod } : undefined
    );
    return response.data;
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    const response = await this.http.post<StripePaymentIntent>(`/payment_intents/${paymentIntentId}/cancel`);
    return response.data;
  }

  // =====================
  // Invoices
  // =====================

  async listInvoices(options?: {
    customer?: string;
    subscription?: string;
    status?: StripeInvoice['status'];
    limit?: number;
  }): Promise<{ data: StripeInvoice[]; hasMore: boolean }> {
    const query: Record<string, string> = {};

    if (options?.customer) query.customer = options.customer;
    if (options?.subscription) query.subscription = options.subscription;
    if (options?.status) query.status = options.status;
    if (options?.limit) query.limit = String(options.limit);

    const response = await this.http.get<{ data: StripeInvoice[]; has_more: boolean }>('/invoices', query);
    return { data: response.data.data, hasMore: response.data.has_more };
  }

  async getInvoice(invoiceId: string): Promise<StripeInvoice> {
    const response = await this.http.get<StripeInvoice>(`/invoices/${invoiceId}`);
    return response.data;
  }

  async payInvoice(invoiceId: string): Promise<StripeInvoice> {
    const response = await this.http.post<StripeInvoice>(`/invoices/${invoiceId}/pay`);
    return response.data;
  }

  async voidInvoice(invoiceId: string): Promise<StripeInvoice> {
    const response = await this.http.post<StripeInvoice>(`/invoices/${invoiceId}/void`);
    return response.data;
  }
}

export default StripeClient;
