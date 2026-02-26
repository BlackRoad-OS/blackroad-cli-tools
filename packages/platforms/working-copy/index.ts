/**
 * BlackRoad Platform Integration - Working Copy (iOS Git Client)
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Working Copy iOS Git client integration for:
 * - Repository management
 * - x-callback-url automation
 * - iOS Shortcuts integration
 * - File syncing with other iOS apps
 */

import { createPlatformConfig, PlatformConfig } from '../core';

export interface WCRepository {
  name: string;
  path: string;
  remoteUrl?: string;
  branch?: string;
  lastSync?: string;
}

export interface WCFile {
  path: string;
  repository: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'unchanged';
}

export interface WCCallbackParams {
  repo?: string;
  path?: string;
  text?: string;
  branch?: string;
  remote?: string;
  message?: string;
  key?: string;
  mode?: string;
  command?: string;
  uti?: string;
  filename?: string;
  'x-success'?: string;
  'x-error'?: string;
  'x-cancel'?: string;
}

/**
 * Working Copy Integration Client
 *
 * Provides automation capabilities for the Working Copy iOS Git client.
 * Uses x-callback-url scheme for iOS Shortcuts integration.
 *
 * x-callback-url documentation: https://workingcopy.app/url-schemes.html
 */
export class WorkingCopyClient {
  private config: PlatformConfig;
  private apiKey?: string;

  constructor() {
    this.config = createPlatformConfig(
      'WorkingCopy',
      'working-copy://',
      'WORKING_COPY',
      { version: 'v1' }
    );

    // Working Copy API key for advanced operations
    this.apiKey = process.env.WORKING_COPY_API_KEY;
  }

  // =====================
  // URL Generation
  // =====================

  /**
   * Generate base x-callback-url
   */
  private generateURL(action: string, params: WCCallbackParams = {}): string {
    const baseURL = `working-copy://x-callback-url/${action}`;
    const queryParams = new URLSearchParams();

    // Add API key if available
    if (this.apiKey) {
      queryParams.append('key', this.apiKey);
    }

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    }

    const queryString = queryParams.toString();
    return queryString ? `${baseURL}?${queryString}` : baseURL;
  }

  // =====================
  // Repository Operations
  // =====================

  /**
   * Generate URL to clone a repository
   */
  generateCloneURL(remoteUrl: string, callbacks?: {
    success?: string;
    error?: string;
    cancel?: string;
  }): string {
    return this.generateURL('clone', {
      remote: remoteUrl,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
      'x-cancel': callbacks?.cancel,
    });
  }

  /**
   * Generate URL to open a repository
   */
  generateOpenRepoURL(repoName: string): string {
    return this.generateURL('open', { repo: repoName });
  }

  /**
   * Generate URL to pull changes
   */
  generatePullURL(repoName: string, callbacks?: {
    success?: string;
    error?: string;
  }): string {
    return this.generateURL('pull', {
      repo: repoName,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
    });
  }

  /**
   * Generate URL to push changes
   */
  generatePushURL(repoName: string, callbacks?: {
    success?: string;
    error?: string;
  }): string {
    return this.generateURL('push', {
      repo: repoName,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
    });
  }

  /**
   * Generate URL to commit changes
   */
  generateCommitURL(repoName: string, message: string, callbacks?: {
    success?: string;
    error?: string;
  }): string {
    return this.generateURL('commit', {
      repo: repoName,
      message,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
    });
  }

  /**
   * Generate URL to fetch from remote
   */
  generateFetchURL(repoName: string, callbacks?: {
    success?: string;
    error?: string;
  }): string {
    return this.generateURL('fetch', {
      repo: repoName,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
    });
  }

  // =====================
  // Branch Operations
  // =====================

  /**
   * Generate URL to checkout a branch
   */
  generateCheckoutURL(repoName: string, branch: string, callbacks?: {
    success?: string;
    error?: string;
  }): string {
    return this.generateURL('checkout', {
      repo: repoName,
      branch,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
    });
  }

  /**
   * Generate URL to create a new branch
   */
  generateBranchURL(repoName: string, branchName: string, callbacks?: {
    success?: string;
    error?: string;
  }): string {
    return this.generateURL('branch', {
      repo: repoName,
      branch: branchName,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
    });
  }

  /**
   * Generate URL to merge branches
   */
  generateMergeURL(repoName: string, sourceBranch: string, callbacks?: {
    success?: string;
    error?: string;
  }): string {
    return this.generateURL('merge', {
      repo: repoName,
      branch: sourceBranch,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
    });
  }

  // =====================
  // File Operations
  // =====================

  /**
   * Generate URL to read a file
   */
  generateReadFileURL(repoName: string, filePath: string, callbacks?: {
    success?: string;
    error?: string;
  }): string {
    return this.generateURL('read', {
      repo: repoName,
      path: filePath,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
    });
  }

  /**
   * Generate URL to write a file
   */
  generateWriteFileURL(repoName: string, filePath: string, content: string, callbacks?: {
    success?: string;
    error?: string;
  }): string {
    return this.generateURL('write', {
      repo: repoName,
      path: filePath,
      text: content,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
    });
  }

  /**
   * Generate URL to move/rename a file
   */
  generateMoveFileURL(repoName: string, sourcePath: string, destPath: string, callbacks?: {
    success?: string;
    error?: string;
  }): string {
    // Working Copy uses a specific URL format for move
    return this.generateURL('move', {
      repo: repoName,
      path: sourcePath,
      filename: destPath,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
    });
  }

  /**
   * Generate URL to delete a file
   */
  generateDeleteFileURL(repoName: string, filePath: string, callbacks?: {
    success?: string;
    error?: string;
  }): string {
    return this.generateURL('delete', {
      repo: repoName,
      path: filePath,
      'x-success': callbacks?.success,
      'x-error': callbacks?.error,
    });
  }

  // =====================
  // Chain Operations
  // =====================

  /**
   * Generate URL chain for full sync (fetch, pull, push)
   * Note: Callbacks chain the operations together
   */
  generateSyncChainURLs(repoName: string, commitMessage?: string): {
    fetch: string;
    pull: string;
    commit?: string;
    push: string;
  } {
    const pushUrl = this.generatePushURL(repoName);
    const commitUrl = commitMessage ? this.generateCommitURL(repoName, commitMessage, {
      success: pushUrl,
    }) : undefined;
    const pullUrl = this.generatePullURL(repoName, {
      success: commitUrl || pushUrl,
    });
    const fetchUrl = this.generateFetchURL(repoName, {
      success: pullUrl,
    });

    return {
      fetch: fetchUrl,
      pull: pullUrl,
      commit: commitUrl,
      push: pushUrl,
    };
  }

  // =====================
  // Universal Links
  // =====================

  /**
   * Generate a universal link for GitHub repository
   */
  generateGitHubCloneLink(owner: string, repo: string): string {
    return `https://workingcopy.app/git/#repo=https://github.com/${owner}/${repo}.git`;
  }

  /**
   * Generate a universal link for GitLab repository
   */
  generateGitLabCloneLink(owner: string, repo: string): string {
    return `https://workingcopy.app/git/#repo=https://gitlab.com/${owner}/${repo}.git`;
  }

  /**
   * Generate a universal link for Bitbucket repository
   */
  generateBitbucketCloneLink(owner: string, repo: string): string {
    return `https://workingcopy.app/git/#repo=https://bitbucket.org/${owner}/${repo}.git`;
  }

  // =====================
  // iOS Shortcuts Integration
  // =====================

  /**
   * Generate Shortcuts-compatible action dictionary
   */
  generateShortcutAction(action: string, params: WCCallbackParams): object {
    return {
      WFWorkflowActionIdentifier: 'is.workflow.actions.openurl',
      WFWorkflowActionParameters: {
        WFInput: {
          Value: {
            string: this.generateURL(action, params),
          },
          WFSerializationType: 'WFTextTokenString',
        },
      },
    };
  }

  /**
   * Generate a complete Shortcuts workflow for BlackRoad deployment
   */
  generateDeploymentShortcut(repoName: string): object {
    return {
      WFWorkflowName: `Deploy ${repoName}`,
      WFWorkflowActions: [
        this.generateShortcutAction('pull', { repo: repoName }),
        // Add delay action
        {
          WFWorkflowActionIdentifier: 'is.workflow.actions.delay',
          WFWorkflowActionParameters: {
            WFDelayTime: 2,
          },
        },
        this.generateShortcutAction('push', { repo: repoName }),
      ],
    };
  }

  // =====================
  // BlackRoad Integration
  // =====================

  /**
   * Generate BlackRoad deployment workflow URLs
   */
  generateBlackRoadWorkflow(repoName: string): {
    setup: string;
    sync: string;
    deploy: string;
  } {
    return {
      setup: this.generateCloneURL(`https://github.com/BlackRoad-OS/${repoName}.git`),
      sync: this.generateSyncChainURLs(repoName).fetch,
      deploy: this.generateCommitURL(repoName, 'deploy: automated BlackRoad deployment', {
        success: this.generatePushURL(repoName),
      }),
    };
  }
}

export default WorkingCopyClient;
