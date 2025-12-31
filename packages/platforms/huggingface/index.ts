/**
 * BlackRoad Platform Integration - Hugging Face
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Hugging Face platform integration for:
 * - Model inference
 * - Model repository management
 * - Spaces deployment
 * - Dataset management
 * - Safe model validation
 */

import { createPlatformConfig, SafeHttpClient, PlatformConfig } from '../core';

export interface HFModel {
  id: string;
  modelId: string;
  author?: string;
  sha: string;
  lastModified: string;
  private: boolean;
  disabled?: boolean;
  gated?: boolean | 'auto' | 'manual';
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag?: string;
  library_name?: string;
  config?: Record<string, unknown>;
  siblings?: Array<{
    rfilename: string;
    size?: number;
    blobId?: string;
  }>;
  createdAt?: string;
}

export interface HFDataset {
  id: string;
  author?: string;
  sha: string;
  lastModified: string;
  private: boolean;
  disabled?: boolean;
  gated?: boolean | 'auto' | 'manual';
  downloads: number;
  likes: number;
  tags: string[];
  description?: string;
  cardData?: Record<string, unknown>;
  createdAt?: string;
}

export interface HFSpace {
  id: string;
  author?: string;
  sha: string;
  lastModified: string;
  private: boolean;
  sdk?: 'gradio' | 'streamlit' | 'docker' | 'static';
  tags: string[];
  likes: number;
  runtime?: {
    stage: 'BUILDING' | 'RUNNING' | 'STOPPED' | 'PAUSED' | 'ERROR';
    hardware?: {
      current?: string;
      requested?: string;
    };
  };
  createdAt?: string;
}

export interface HFInferenceRequest {
  inputs: string | string[] | Record<string, unknown>;
  parameters?: Record<string, unknown>;
  options?: {
    useCache?: boolean;
    waitForModel?: boolean;
  };
}

export interface HFInferenceResponse {
  generated_text?: string;
  label?: string;
  score?: number;
  translation_text?: string;
  summary_text?: string;
  answer?: string;
  [key: string]: unknown;
}

export interface HFRepoFile {
  type: 'file' | 'directory';
  path: string;
  size?: number;
  oid?: string;
  lfs?: {
    oid: string;
    size: number;
    pointerSize: number;
  };
}

export interface HFSafetyCheck {
  modelId: string;
  isSafe: boolean;
  warnings: string[];
  license: string;
  hasPickle: boolean;
  hasSafetensors: boolean;
  cardExists: boolean;
  cardWarnings: string[];
}

/**
 * Hugging Face Platform Client
 *
 * Environment Variables Required:
 * - HUGGINGFACE_API_KEY: Your Hugging Face API token
 * - HUGGINGFACE_ENABLED: Set to 'true' to enable
 */
export class HuggingFaceClient {
  private config: PlatformConfig;
  private http: SafeHttpClient;
  private inferenceHttp: SafeHttpClient;

  constructor() {
    this.config = createPlatformConfig(
      'HuggingFace',
      'https://huggingface.co/api',
      'HUGGINGFACE',
      { version: 'v1', rateLimitPerMinute: 60 }
    );
    this.http = new SafeHttpClient(this.config);

    // Separate client for inference API
    const inferenceConfig = createPlatformConfig(
      'HuggingFaceInference',
      'https://api-inference.huggingface.co/models',
      'HUGGINGFACE',
      { version: 'v1', rateLimitPerMinute: 30, timeout: 120000 }
    );
    this.inferenceHttp = new SafeHttpClient(inferenceConfig);
  }

  // =====================
  // Models
  // =====================

  async listModels(options?: {
    search?: string;
    author?: string;
    filter?: string;
    sort?: 'downloads' | 'likes' | 'lastModified';
    direction?: 'asc' | 'desc';
    limit?: number;
    full?: boolean;
  }): Promise<HFModel[]> {
    const query: Record<string, string> = {};

    if (options?.search) query.search = options.search;
    if (options?.author) query.author = options.author;
    if (options?.filter) query.filter = options.filter;
    if (options?.sort) query.sort = options.sort;
    if (options?.direction) query.direction = options.direction === 'asc' ? '1' : '-1';
    if (options?.limit) query.limit = String(options.limit);
    if (options?.full) query.full = 'true';

    const response = await this.http.get<HFModel[]>('/models', query);
    return response.data;
  }

  async getModel(modelId: string): Promise<HFModel> {
    const response = await this.http.get<HFModel>(`/models/${modelId}`);
    return response.data;
  }

  async listModelFiles(modelId: string, revision?: string): Promise<HFRepoFile[]> {
    const path = revision ? `/models/${modelId}/tree/${revision}` : `/models/${modelId}/tree/main`;
    const response = await this.http.get<HFRepoFile[]>(path);
    return response.data;
  }

  // =====================
  // Datasets
  // =====================

  async listDatasets(options?: {
    search?: string;
    author?: string;
    filter?: string;
    sort?: 'downloads' | 'likes' | 'lastModified';
    direction?: 'asc' | 'desc';
    limit?: number;
  }): Promise<HFDataset[]> {
    const query: Record<string, string> = {};

    if (options?.search) query.search = options.search;
    if (options?.author) query.author = options.author;
    if (options?.filter) query.filter = options.filter;
    if (options?.sort) query.sort = options.sort;
    if (options?.direction) query.direction = options.direction === 'asc' ? '1' : '-1';
    if (options?.limit) query.limit = String(options.limit);

    const response = await this.http.get<HFDataset[]>('/datasets', query);
    return response.data;
  }

  async getDataset(datasetId: string): Promise<HFDataset> {
    const response = await this.http.get<HFDataset>(`/datasets/${datasetId}`);
    return response.data;
  }

  // =====================
  // Spaces
  // =====================

  async listSpaces(options?: {
    search?: string;
    author?: string;
    sort?: 'likes' | 'lastModified';
    direction?: 'asc' | 'desc';
    limit?: number;
  }): Promise<HFSpace[]> {
    const query: Record<string, string> = {};

    if (options?.search) query.search = options.search;
    if (options?.author) query.author = options.author;
    if (options?.sort) query.sort = options.sort;
    if (options?.direction) query.direction = options.direction === 'asc' ? '1' : '-1';
    if (options?.limit) query.limit = String(options.limit);

    const response = await this.http.get<HFSpace[]>('/spaces', query);
    return response.data;
  }

  async getSpace(spaceId: string): Promise<HFSpace> {
    const response = await this.http.get<HFSpace>(`/spaces/${spaceId}`);
    return response.data;
  }

  async restartSpace(spaceId: string): Promise<void> {
    await this.http.post(`/spaces/${spaceId}/restart`);
  }

  // =====================
  // Inference
  // =====================

  async inference(modelId: string, request: HFInferenceRequest): Promise<HFInferenceResponse | HFInferenceResponse[]> {
    const response = await this.inferenceHttp.post<HFInferenceResponse | HFInferenceResponse[]>(
      `/${modelId}`,
      request
    );
    return response.data;
  }

  async textGeneration(modelId: string, prompt: string, options?: {
    maxNewTokens?: number;
    temperature?: number;
    topK?: number;
    topP?: number;
    repetitionPenalty?: number;
    doSample?: boolean;
  }): Promise<string> {
    const response = await this.inference(modelId, {
      inputs: prompt,
      parameters: {
        max_new_tokens: options?.maxNewTokens || 100,
        temperature: options?.temperature || 0.7,
        top_k: options?.topK,
        top_p: options?.topP,
        repetition_penalty: options?.repetitionPenalty,
        do_sample: options?.doSample ?? true,
      },
    });

    if (Array.isArray(response)) {
      return response[0]?.generated_text || '';
    }
    return response.generated_text || '';
  }

  async textClassification(modelId: string, text: string): Promise<Array<{ label: string; score: number }>> {
    const response = await this.inference(modelId, { inputs: text });

    if (Array.isArray(response)) {
      return response.map(r => ({ label: r.label || '', score: r.score || 0 }));
    }
    return [{ label: response.label || '', score: response.score || 0 }];
  }

  async summarization(modelId: string, text: string, options?: {
    maxLength?: number;
    minLength?: number;
  }): Promise<string> {
    const response = await this.inference(modelId, {
      inputs: text,
      parameters: {
        max_length: options?.maxLength,
        min_length: options?.minLength,
      },
    });

    if (Array.isArray(response)) {
      return response[0]?.summary_text || '';
    }
    return response.summary_text || '';
  }

  async translation(modelId: string, text: string): Promise<string> {
    const response = await this.inference(modelId, { inputs: text });

    if (Array.isArray(response)) {
      return response[0]?.translation_text || '';
    }
    return response.translation_text || '';
  }

  async questionAnswering(modelId: string, question: string, context: string): Promise<{ answer: string; score: number }> {
    const response = await this.inference(modelId, {
      inputs: { question, context },
    }) as HFInferenceResponse;

    return {
      answer: response.answer || '',
      score: response.score || 0,
    };
  }

  async fillMask(modelId: string, text: string): Promise<Array<{ sequence: string; score: number; token_str: string }>> {
    const response = await this.inference(modelId, { inputs: text });

    if (Array.isArray(response)) {
      return response as unknown as Array<{ sequence: string; score: number; token_str: string }>;
    }
    return [];
  }

  // =====================
  // Safety Checks
  // =====================

  /**
   * Perform safety check on a model
   * Validates that a model is safe to use (no malicious code, proper licensing, etc.)
   */
  async checkModelSafety(modelId: string): Promise<HFSafetyCheck> {
    const model = await this.getModel(modelId);
    const files = await this.listModelFiles(modelId);

    const warnings: string[] = [];
    const cardWarnings: string[] = [];

    // Check for pickle files (potential security risk)
    const hasPickle = files.some(f =>
      f.path.endsWith('.pkl') ||
      f.path.endsWith('.pickle') ||
      f.path.endsWith('.bin')
    );

    // Check for safetensors (safer alternative)
    const hasSafetensors = files.some(f => f.path.endsWith('.safetensors'));

    // Check for model card
    const cardExists = files.some(f => f.path === 'README.md');

    // Get license from tags
    const licenseTag = model.tags.find(t => t.startsWith('license:'));
    const license = licenseTag?.replace('license:', '') || 'unknown';

    // Safety warnings
    if (hasPickle && !hasSafetensors) {
      warnings.push('Model uses pickle format which may contain arbitrary code. Consider using safetensors format.');
    }

    if (license === 'unknown') {
      warnings.push('Model license is unknown. Verify licensing before use.');
    }

    if (!cardExists) {
      cardWarnings.push('Model card (README.md) is missing. Model documentation is incomplete.');
    }

    if (model.disabled) {
      warnings.push('Model has been disabled by Hugging Face.');
    }

    if (model.gated) {
      warnings.push('Model is gated. Access may require approval.');
    }

    // Determine overall safety
    const isSafe = !model.disabled && warnings.length === 0;

    return {
      modelId,
      isSafe,
      warnings,
      license,
      hasPickle,
      hasSafetensors,
      cardExists,
      cardWarnings,
    };
  }

  /**
   * List only models that use safe serialization formats
   */
  async listSafeModels(options?: {
    search?: string;
    author?: string;
    pipelineTag?: string;
    limit?: number;
  }): Promise<HFModel[]> {
    const models = await this.listModels({
      search: options?.search,
      author: options?.author,
      filter: options?.pipelineTag,
      limit: (options?.limit || 20) * 2, // Fetch extra to filter
      full: true,
    });

    // Filter for models with safetensors
    const safeModels: HFModel[] = [];

    for (const model of models) {
      if (safeModels.length >= (options?.limit || 20)) break;

      const hasSafetensors = model.siblings?.some(s => s.rfilename.endsWith('.safetensors'));
      if (hasSafetensors) {
        safeModels.push(model);
      }
    }

    return safeModels;
  }
}

export default HuggingFaceClient;
