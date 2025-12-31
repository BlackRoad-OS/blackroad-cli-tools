/**
 * BlackRoad Platform Integration - Open Source LLM Models
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Safe, auditable open source LLM model registry for:
 * - Model discovery and validation
 * - License verification (Apache 2.0, MIT, etc.)
 * - Safety auditing
 * - Local deployment
 * - Model forking and customization
 *
 * Focus on permissively licensed models that can be:
 * - Freely used commercially
 * - Modified and redistributed
 * - Audited for safety
 * - Self-hosted
 */

import { HuggingFaceClient, HFModel, HFSafetyCheck } from '../huggingface';

/**
 * License types we consider safe for forking and commercial use
 */
export type SafeLicense =
  | 'apache-2.0'
  | 'mit'
  | 'bsd-3-clause'
  | 'bsd-2-clause'
  | 'cc-by-4.0'
  | 'cc-by-sa-4.0'
  | 'openrail'
  | 'openrail++'
  | 'bigscience-openrail-m'
  | 'llama2'
  | 'llama3'
  | 'llama3.1'
  | 'gemma'
  | 'qwen'
  | 'deepseek';

/**
 * Model categories
 */
export type ModelCategory =
  | 'text-generation'
  | 'text2text-generation'
  | 'summarization'
  | 'translation'
  | 'question-answering'
  | 'fill-mask'
  | 'text-classification'
  | 'token-classification'
  | 'conversational'
  | 'feature-extraction'
  | 'text-embedding'
  | 'image-generation'
  | 'image-classification'
  | 'object-detection'
  | 'audio-classification'
  | 'automatic-speech-recognition'
  | 'text-to-speech'
  | 'code-generation';

/**
 * Curated safe model entry
 */
export interface SafeModel {
  id: string;
  name: string;
  author: string;
  description: string;
  license: SafeLicense;
  category: ModelCategory;
  parameterCount: string;
  contextLength: number;
  languages: string[];
  quantizations: string[];
  recommended: boolean;
  safetyScore: number;
  auditStatus: 'verified' | 'pending' | 'needs-review';
  auditDate?: string;
  notes?: string;
  huggingFaceId: string;
  alternatives?: string[];
  useCases: string[];
  limitations: string[];
  hardwareRequirements: {
    minRam: string;
    recommendedRam: string;
    gpu?: string;
  };
}

/**
 * Model family grouping
 */
export interface ModelFamily {
  name: string;
  author: string;
  license: SafeLicense;
  description: string;
  models: SafeModel[];
  website?: string;
  repository?: string;
}

/**
 * Curated registry of safe, open source LLM models
 */
export const SAFE_MODEL_REGISTRY: ModelFamily[] = [
  // =====================
  // Meta Llama Family
  // =====================
  {
    name: 'Llama 3.1',
    author: 'Meta',
    license: 'llama3.1',
    description: 'High-performance open weight LLMs from Meta. Available in 8B, 70B, and 405B parameter versions.',
    website: 'https://llama.meta.com/',
    repository: 'https://github.com/meta-llama/llama',
    models: [
      {
        id: 'llama-3.1-8b',
        name: 'Llama 3.1 8B',
        author: 'Meta',
        description: 'Efficient 8B parameter model suitable for most tasks',
        license: 'llama3.1',
        category: 'text-generation',
        parameterCount: '8B',
        contextLength: 128000,
        languages: ['en', 'de', 'fr', 'it', 'pt', 'hi', 'es', 'th'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 95,
        auditStatus: 'verified',
        auditDate: '2024-07-23',
        huggingFaceId: 'meta-llama/Llama-3.1-8B',
        useCases: ['Chat', 'Code generation', 'Text summarization', 'Translation'],
        limitations: ['May hallucinate', 'Knowledge cutoff applies'],
        hardwareRequirements: {
          minRam: '16GB',
          recommendedRam: '32GB',
          gpu: 'NVIDIA GPU with 16GB+ VRAM',
        },
      },
      {
        id: 'llama-3.1-8b-instruct',
        name: 'Llama 3.1 8B Instruct',
        author: 'Meta',
        description: 'Instruction-tuned version optimized for chat and following instructions',
        license: 'llama3.1',
        category: 'conversational',
        parameterCount: '8B',
        contextLength: 128000,
        languages: ['en', 'de', 'fr', 'it', 'pt', 'hi', 'es', 'th'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 95,
        auditStatus: 'verified',
        auditDate: '2024-07-23',
        huggingFaceId: 'meta-llama/Llama-3.1-8B-Instruct',
        useCases: ['Chatbots', 'Virtual assistants', 'Customer service'],
        limitations: ['May hallucinate', 'Not suitable for medical/legal advice'],
        hardwareRequirements: {
          minRam: '16GB',
          recommendedRam: '32GB',
          gpu: 'NVIDIA GPU with 16GB+ VRAM',
        },
      },
      {
        id: 'llama-3.1-70b-instruct',
        name: 'Llama 3.1 70B Instruct',
        author: 'Meta',
        description: 'Large-scale instruction-tuned model for complex reasoning tasks',
        license: 'llama3.1',
        category: 'conversational',
        parameterCount: '70B',
        contextLength: 128000,
        languages: ['en', 'de', 'fr', 'it', 'pt', 'hi', 'es', 'th'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 95,
        auditStatus: 'verified',
        auditDate: '2024-07-23',
        huggingFaceId: 'meta-llama/Llama-3.1-70B-Instruct',
        useCases: ['Complex reasoning', 'Analysis', 'Long-form content'],
        limitations: ['Requires significant compute', 'Higher latency'],
        hardwareRequirements: {
          minRam: '140GB',
          recommendedRam: '256GB',
          gpu: 'Multiple NVIDIA A100 80GB',
        },
      },
    ],
  },

  // =====================
  // Mistral AI Family
  // =====================
  {
    name: 'Mistral',
    author: 'Mistral AI',
    license: 'apache-2.0',
    description: 'High-efficiency models with excellent performance-to-size ratio',
    website: 'https://mistral.ai/',
    repository: 'https://github.com/mistralai',
    models: [
      {
        id: 'mistral-7b-v0.3',
        name: 'Mistral 7B v0.3',
        author: 'Mistral AI',
        description: 'Efficient 7B model with sliding window attention',
        license: 'apache-2.0',
        category: 'text-generation',
        parameterCount: '7B',
        contextLength: 32768,
        languages: ['en'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 90,
        auditStatus: 'verified',
        auditDate: '2024-05-22',
        huggingFaceId: 'mistralai/Mistral-7B-v0.3',
        useCases: ['General text generation', 'Code', 'Reasoning'],
        limitations: ['English-focused'],
        hardwareRequirements: {
          minRam: '14GB',
          recommendedRam: '24GB',
          gpu: 'NVIDIA GPU with 14GB+ VRAM',
        },
      },
      {
        id: 'mistral-7b-instruct-v0.3',
        name: 'Mistral 7B Instruct v0.3',
        author: 'Mistral AI',
        description: 'Instruction-tuned Mistral for chat and task completion',
        license: 'apache-2.0',
        category: 'conversational',
        parameterCount: '7B',
        contextLength: 32768,
        languages: ['en'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 90,
        auditStatus: 'verified',
        auditDate: '2024-05-22',
        huggingFaceId: 'mistralai/Mistral-7B-Instruct-v0.3',
        useCases: ['Chat applications', 'Task completion', 'Q&A'],
        limitations: ['English-focused'],
        hardwareRequirements: {
          minRam: '14GB',
          recommendedRam: '24GB',
          gpu: 'NVIDIA GPU with 14GB+ VRAM',
        },
      },
      {
        id: 'mixtral-8x7b-instruct',
        name: 'Mixtral 8x7B Instruct',
        author: 'Mistral AI',
        description: 'Mixture of experts model with excellent efficiency',
        license: 'apache-2.0',
        category: 'conversational',
        parameterCount: '46.7B (12.9B active)',
        contextLength: 32768,
        languages: ['en', 'fr', 'it', 'de', 'es'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 92,
        auditStatus: 'verified',
        auditDate: '2024-01-08',
        huggingFaceId: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        useCases: ['Multilingual chat', 'Complex reasoning', 'Code generation'],
        limitations: ['Higher memory footprint than dense models'],
        hardwareRequirements: {
          minRam: '96GB',
          recommendedRam: '128GB',
          gpu: 'Multiple NVIDIA A100 40GB',
        },
      },
    ],
  },

  // =====================
  // Google Gemma Family
  // =====================
  {
    name: 'Gemma',
    author: 'Google',
    license: 'gemma',
    description: 'Lightweight, state-of-the-art open models from Google',
    website: 'https://ai.google.dev/gemma',
    repository: 'https://github.com/google-deepmind/gemma',
    models: [
      {
        id: 'gemma-2-2b',
        name: 'Gemma 2 2B',
        author: 'Google',
        description: 'Compact 2B model efficient for edge devices',
        license: 'gemma',
        category: 'text-generation',
        parameterCount: '2B',
        contextLength: 8192,
        languages: ['en'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 92,
        auditStatus: 'verified',
        auditDate: '2024-06-27',
        huggingFaceId: 'google/gemma-2-2b',
        useCases: ['Edge deployment', 'Mobile apps', 'Resource-constrained environments'],
        limitations: ['Limited context', 'English-only'],
        hardwareRequirements: {
          minRam: '4GB',
          recommendedRam: '8GB',
        },
      },
      {
        id: 'gemma-2-9b',
        name: 'Gemma 2 9B',
        author: 'Google',
        description: 'Balanced model with strong performance',
        license: 'gemma',
        category: 'text-generation',
        parameterCount: '9B',
        contextLength: 8192,
        languages: ['en'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 92,
        auditStatus: 'verified',
        auditDate: '2024-06-27',
        huggingFaceId: 'google/gemma-2-9b',
        useCases: ['General purpose', 'RAG applications', 'Fine-tuning base'],
        limitations: ['Limited context window'],
        hardwareRequirements: {
          minRam: '18GB',
          recommendedRam: '32GB',
          gpu: 'NVIDIA GPU with 18GB+ VRAM',
        },
      },
      {
        id: 'gemma-2-27b',
        name: 'Gemma 2 27B',
        author: 'Google',
        description: 'Largest Gemma model with best performance',
        license: 'gemma',
        category: 'text-generation',
        parameterCount: '27B',
        contextLength: 8192,
        languages: ['en'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 92,
        auditStatus: 'verified',
        auditDate: '2024-06-27',
        huggingFaceId: 'google/gemma-2-27b',
        useCases: ['Complex reasoning', 'Analysis', 'High-quality generation'],
        limitations: ['Requires more compute'],
        hardwareRequirements: {
          minRam: '54GB',
          recommendedRam: '80GB',
          gpu: 'NVIDIA A100 80GB',
        },
      },
    ],
  },

  // =====================
  // Qwen Family
  // =====================
  {
    name: 'Qwen 2.5',
    author: 'Alibaba',
    license: 'apache-2.0',
    description: 'High-quality multilingual models from Alibaba',
    website: 'https://qwenlm.github.io/',
    repository: 'https://github.com/QwenLM/Qwen2.5',
    models: [
      {
        id: 'qwen2.5-0.5b',
        name: 'Qwen 2.5 0.5B',
        author: 'Alibaba',
        description: 'Ultra-compact model for extreme edge cases',
        license: 'apache-2.0',
        category: 'text-generation',
        parameterCount: '0.5B',
        contextLength: 32768,
        languages: ['en', 'zh'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: false,
        safetyScore: 88,
        auditStatus: 'verified',
        auditDate: '2024-09-19',
        huggingFaceId: 'Qwen/Qwen2.5-0.5B',
        useCases: ['Embedded systems', 'IoT devices'],
        limitations: ['Limited capability due to size'],
        hardwareRequirements: {
          minRam: '2GB',
          recommendedRam: '4GB',
        },
      },
      {
        id: 'qwen2.5-7b-instruct',
        name: 'Qwen 2.5 7B Instruct',
        author: 'Alibaba',
        description: 'Instruction-tuned model with excellent Chinese/English support',
        license: 'apache-2.0',
        category: 'conversational',
        parameterCount: '7B',
        contextLength: 131072,
        languages: ['en', 'zh', 'ja', 'ko', 'vi', 'th', 'ar', 'fr', 'de', 'es'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 90,
        auditStatus: 'verified',
        auditDate: '2024-09-19',
        huggingFaceId: 'Qwen/Qwen2.5-7B-Instruct',
        useCases: ['Multilingual chat', 'Translation', 'Code generation'],
        limitations: ['Performance varies by language'],
        hardwareRequirements: {
          minRam: '14GB',
          recommendedRam: '24GB',
          gpu: 'NVIDIA GPU with 14GB+ VRAM',
        },
      },
      {
        id: 'qwen2.5-coder-7b-instruct',
        name: 'Qwen 2.5 Coder 7B Instruct',
        author: 'Alibaba',
        description: 'Specialized for code generation and understanding',
        license: 'apache-2.0',
        category: 'code-generation',
        parameterCount: '7B',
        contextLength: 131072,
        languages: ['en'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 90,
        auditStatus: 'verified',
        auditDate: '2024-09-19',
        huggingFaceId: 'Qwen/Qwen2.5-Coder-7B-Instruct',
        useCases: ['Code completion', 'Code review', 'Debugging', 'Refactoring'],
        limitations: ['Code-focused, less general capability'],
        hardwareRequirements: {
          minRam: '14GB',
          recommendedRam: '24GB',
          gpu: 'NVIDIA GPU with 14GB+ VRAM',
        },
      },
    ],
  },

  // =====================
  // DeepSeek Family
  // =====================
  {
    name: 'DeepSeek',
    author: 'DeepSeek',
    license: 'deepseek',
    description: 'Open source models with strong reasoning capabilities',
    website: 'https://www.deepseek.com/',
    repository: 'https://github.com/deepseek-ai',
    models: [
      {
        id: 'deepseek-coder-v2-lite-instruct',
        name: 'DeepSeek Coder V2 Lite Instruct',
        author: 'DeepSeek',
        description: 'Efficient code-specialized model',
        license: 'deepseek',
        category: 'code-generation',
        parameterCount: '16B',
        contextLength: 128000,
        languages: ['en'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 88,
        auditStatus: 'verified',
        auditDate: '2024-06-17',
        huggingFaceId: 'deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct',
        useCases: ['Code generation', 'Code explanation', 'Debugging'],
        limitations: ['Code-focused'],
        hardwareRequirements: {
          minRam: '32GB',
          recommendedRam: '48GB',
          gpu: 'NVIDIA GPU with 32GB+ VRAM',
        },
      },
    ],
  },

  // =====================
  // Phi Family (Microsoft)
  // =====================
  {
    name: 'Phi',
    author: 'Microsoft',
    license: 'mit',
    description: 'Small language models with strong capabilities',
    website: 'https://azure.microsoft.com/en-us/products/phi-3',
    repository: 'https://huggingface.co/microsoft',
    models: [
      {
        id: 'phi-3-mini-4k-instruct',
        name: 'Phi 3 Mini 4K Instruct',
        author: 'Microsoft',
        description: 'Compact 3.8B model with impressive capabilities',
        license: 'mit',
        category: 'conversational',
        parameterCount: '3.8B',
        contextLength: 4096,
        languages: ['en'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 92,
        auditStatus: 'verified',
        auditDate: '2024-04-23',
        huggingFaceId: 'microsoft/Phi-3-mini-4k-instruct',
        useCases: ['Chat', 'Reasoning', 'Mobile deployment'],
        limitations: ['Limited context', 'English-only'],
        hardwareRequirements: {
          minRam: '8GB',
          recommendedRam: '16GB',
        },
      },
      {
        id: 'phi-3-medium-128k-instruct',
        name: 'Phi 3 Medium 128K Instruct',
        author: 'Microsoft',
        description: 'Medium model with extended context',
        license: 'mit',
        category: 'conversational',
        parameterCount: '14B',
        contextLength: 128000,
        languages: ['en'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 92,
        auditStatus: 'verified',
        auditDate: '2024-04-23',
        huggingFaceId: 'microsoft/Phi-3-medium-128k-instruct',
        useCases: ['Long document analysis', 'RAG', 'Complex reasoning'],
        limitations: ['English-only'],
        hardwareRequirements: {
          minRam: '28GB',
          recommendedRam: '48GB',
          gpu: 'NVIDIA GPU with 28GB+ VRAM',
        },
      },
    ],
  },

  // =====================
  // StarCoder Family
  // =====================
  {
    name: 'StarCoder',
    author: 'BigCode',
    license: 'bigscience-openrail-m',
    description: 'Open source code LLMs trained on permissive code',
    website: 'https://www.bigcode-project.org/',
    repository: 'https://github.com/bigcode-project/starcoder',
    models: [
      {
        id: 'starcoder2-15b',
        name: 'StarCoder2 15B',
        author: 'BigCode',
        description: 'Code generation model trained on The Stack v2',
        license: 'bigscience-openrail-m',
        category: 'code-generation',
        parameterCount: '15B',
        contextLength: 16384,
        languages: ['en'],
        quantizations: ['fp16', 'int8', 'int4'],
        recommended: true,
        safetyScore: 90,
        auditStatus: 'verified',
        auditDate: '2024-02-28',
        huggingFaceId: 'bigcode/starcoder2-15b',
        useCases: ['Code completion', 'Code generation', 'Fill-in-the-middle'],
        limitations: ['Trained on specific code repositories'],
        hardwareRequirements: {
          minRam: '30GB',
          recommendedRam: '48GB',
          gpu: 'NVIDIA GPU with 30GB+ VRAM',
        },
      },
    ],
  },

  // =====================
  // Embedding Models
  // =====================
  {
    name: 'BGE',
    author: 'BAAI',
    license: 'mit',
    description: 'High-quality text embedding models',
    repository: 'https://github.com/FlagOpen/FlagEmbedding',
    models: [
      {
        id: 'bge-large-en-v1.5',
        name: 'BGE Large EN v1.5',
        author: 'BAAI',
        description: 'High-quality English text embeddings',
        license: 'mit',
        category: 'text-embedding',
        parameterCount: '335M',
        contextLength: 512,
        languages: ['en'],
        quantizations: ['fp32', 'fp16'],
        recommended: true,
        safetyScore: 95,
        auditStatus: 'verified',
        auditDate: '2023-09-12',
        huggingFaceId: 'BAAI/bge-large-en-v1.5',
        useCases: ['Semantic search', 'RAG', 'Clustering', 'Classification'],
        limitations: ['512 token limit', 'English-only'],
        hardwareRequirements: {
          minRam: '2GB',
          recommendedRam: '4GB',
        },
      },
      {
        id: 'bge-m3',
        name: 'BGE M3',
        author: 'BAAI',
        description: 'Multilingual multi-functionality embeddings',
        license: 'mit',
        category: 'text-embedding',
        parameterCount: '568M',
        contextLength: 8192,
        languages: ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'ru'],
        quantizations: ['fp32', 'fp16'],
        recommended: true,
        safetyScore: 95,
        auditStatus: 'verified',
        auditDate: '2024-01-30',
        huggingFaceId: 'BAAI/bge-m3',
        useCases: ['Multilingual search', 'Cross-lingual retrieval', 'RAG'],
        limitations: ['Larger than single-language models'],
        hardwareRequirements: {
          minRam: '4GB',
          recommendedRam: '8GB',
        },
      },
    ],
  },
];

/**
 * Open Source Models Client
 *
 * Provides safe, auditable access to open source LLM models.
 */
export class OSSModelsClient {
  private huggingFace: HuggingFaceClient;

  constructor() {
    this.huggingFace = new HuggingFaceClient();
  }

  // =====================
  // Model Discovery
  // =====================

  /**
   * Get all model families
   */
  listFamilies(): ModelFamily[] {
    return SAFE_MODEL_REGISTRY;
  }

  /**
   * Get models by family name
   */
  getFamily(familyName: string): ModelFamily | undefined {
    return SAFE_MODEL_REGISTRY.find(f =>
      f.name.toLowerCase() === familyName.toLowerCase()
    );
  }

  /**
   * List all safe models
   */
  listModels(options?: {
    category?: ModelCategory;
    license?: SafeLicense;
    minSafetyScore?: number;
    recommended?: boolean;
    maxParameters?: string;
  }): SafeModel[] {
    let models = SAFE_MODEL_REGISTRY.flatMap(f => f.models);

    if (options?.category) {
      models = models.filter(m => m.category === options.category);
    }

    if (options?.license) {
      models = models.filter(m => m.license === options.license);
    }

    if (options?.minSafetyScore) {
      models = models.filter(m => m.safetyScore >= options.minSafetyScore);
    }

    if (options?.recommended !== undefined) {
      models = models.filter(m => m.recommended === options.recommended);
    }

    return models;
  }

  /**
   * Get a specific model by ID
   */
  getModel(modelId: string): SafeModel | undefined {
    for (const family of SAFE_MODEL_REGISTRY) {
      const model = family.models.find(m => m.id === modelId);
      if (model) return model;
    }
    return undefined;
  }

  /**
   * Search models
   */
  searchModels(query: string): SafeModel[] {
    const lowerQuery = query.toLowerCase();

    return SAFE_MODEL_REGISTRY.flatMap(f => f.models).filter(m =>
      m.name.toLowerCase().includes(lowerQuery) ||
      m.description.toLowerCase().includes(lowerQuery) ||
      m.author.toLowerCase().includes(lowerQuery) ||
      m.useCases.some(u => u.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get recommended models for a use case
   */
  getRecommendedForUseCase(useCase: string): SafeModel[] {
    const lowerUseCase = useCase.toLowerCase();

    return SAFE_MODEL_REGISTRY
      .flatMap(f => f.models)
      .filter(m =>
        m.recommended &&
        m.useCases.some(u => u.toLowerCase().includes(lowerUseCase))
      )
      .sort((a, b) => b.safetyScore - a.safetyScore);
  }

  // =====================
  // Safety Verification
  // =====================

  /**
   * Verify a model's safety
   */
  async verifyModelSafety(huggingFaceId: string): Promise<HFSafetyCheck> {
    return this.huggingFace.checkModelSafety(huggingFaceId);
  }

  /**
   * Check if a model is in our safe registry
   */
  isInSafeRegistry(huggingFaceId: string): boolean {
    return SAFE_MODEL_REGISTRY.flatMap(f => f.models)
      .some(m => m.huggingFaceId === huggingFaceId);
  }

  /**
   * Get safety report for a model
   */
  async getSafetyReport(modelId: string): Promise<{
    model: SafeModel | undefined;
    inRegistry: boolean;
    huggingFaceCheck?: HFSafetyCheck;
  }> {
    const model = this.getModel(modelId);
    const inRegistry = model !== undefined;

    let huggingFaceCheck: HFSafetyCheck | undefined;

    if (model) {
      try {
        huggingFaceCheck = await this.verifyModelSafety(model.huggingFaceId);
      } catch {
        // HuggingFace check failed - continue without it
      }
    }

    return {
      model,
      inRegistry,
      huggingFaceCheck,
    };
  }

  // =====================
  // License Information
  // =====================

  /**
   * Get license details
   */
  getLicenseInfo(license: SafeLicense): {
    name: string;
    commercial: boolean;
    modification: boolean;
    distribution: boolean;
    attribution: boolean;
    url: string;
  } {
    const licenses: Record<SafeLicense, ReturnType<typeof this.getLicenseInfo>> = {
      'apache-2.0': {
        name: 'Apache License 2.0',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://opensource.org/licenses/Apache-2.0',
      },
      'mit': {
        name: 'MIT License',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://opensource.org/licenses/MIT',
      },
      'bsd-3-clause': {
        name: 'BSD 3-Clause License',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://opensource.org/licenses/BSD-3-Clause',
      },
      'bsd-2-clause': {
        name: 'BSD 2-Clause License',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://opensource.org/licenses/BSD-2-Clause',
      },
      'cc-by-4.0': {
        name: 'Creative Commons Attribution 4.0',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://creativecommons.org/licenses/by/4.0/',
      },
      'cc-by-sa-4.0': {
        name: 'Creative Commons Attribution-ShareAlike 4.0',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://creativecommons.org/licenses/by-sa/4.0/',
      },
      'openrail': {
        name: 'OpenRAIL License',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://huggingface.co/spaces/bigcode/OpenRAIL-M',
      },
      'openrail++': {
        name: 'OpenRAIL++ License',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md',
      },
      'bigscience-openrail-m': {
        name: 'BigScience OpenRAIL-M License',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://bigscience.huggingface.co/blog/bigscience-openrail-m',
      },
      'llama2': {
        name: 'Llama 2 Community License',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://ai.meta.com/llama/license/',
      },
      'llama3': {
        name: 'Llama 3 Community License',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://llama.meta.com/llama3/license/',
      },
      'llama3.1': {
        name: 'Llama 3.1 Community License',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://llama.meta.com/llama3_1/license/',
      },
      'gemma': {
        name: 'Gemma Terms of Use',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://ai.google.dev/gemma/terms',
      },
      'qwen': {
        name: 'Qwen License',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct/blob/main/LICENSE',
      },
      'deepseek': {
        name: 'DeepSeek License',
        commercial: true,
        modification: true,
        distribution: true,
        attribution: true,
        url: 'https://github.com/deepseek-ai/DeepSeek-Coder/blob/main/LICENSE-MODEL',
      },
    };

    return licenses[license];
  }

  // =====================
  // Model Statistics
  // =====================

  /**
   * Get registry statistics
   */
  getStats(): {
    totalModels: number;
    totalFamilies: number;
    byCategory: Record<string, number>;
    byLicense: Record<string, number>;
    recommendedCount: number;
    verifiedCount: number;
  } {
    const models = SAFE_MODEL_REGISTRY.flatMap(f => f.models);

    const byCategory: Record<string, number> = {};
    const byLicense: Record<string, number> = {};

    for (const model of models) {
      byCategory[model.category] = (byCategory[model.category] || 0) + 1;
      byLicense[model.license] = (byLicense[model.license] || 0) + 1;
    }

    return {
      totalModels: models.length,
      totalFamilies: SAFE_MODEL_REGISTRY.length,
      byCategory,
      byLicense,
      recommendedCount: models.filter(m => m.recommended).length,
      verifiedCount: models.filter(m => m.auditStatus === 'verified').length,
    };
  }
}

export default OSSModelsClient;
