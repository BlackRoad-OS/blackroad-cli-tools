/**
 * BlackRoad Platform Integration - Warp Terminal
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Warp terminal integration for:
 * - Workflow automation
 * - Theme management
 * - Block sharing
 * - AI command suggestions
 * - Team collaboration features
 */

import { createPlatformConfig, PlatformConfig } from '../core';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface WarpWorkflow {
  name: string;
  command: string;
  tags?: string[];
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    defaultValue?: string;
  }>;
}

export interface WarpTheme {
  name: string;
  accent: string;
  background: string;
  foreground: string;
  details: 'darker' | 'lighter';
  terminal_colors: {
    normal: {
      black: string;
      red: string;
      green: string;
      yellow: string;
      blue: string;
      magenta: string;
      cyan: string;
      white: string;
    };
    bright: {
      black: string;
      red: string;
      green: string;
      yellow: string;
      blue: string;
      magenta: string;
      cyan: string;
      white: string;
    };
  };
}

export interface WarpBlock {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  startTime: string;
  endTime: string;
  workingDirectory: string;
}

export interface WarpLaunchConfig {
  name: string;
  windows: Array<{
    tabs: Array<{
      title?: string;
      command?: string;
      workingDirectory?: string;
      environment?: Record<string, string>;
    }>;
  }>;
}

/**
 * Warp Terminal Client
 *
 * Manages Warp terminal configuration and workflows.
 *
 * Environment Variables:
 * - WARP_ENABLED: Set to 'true' to enable
 */
export class WarpClient {
  private config: PlatformConfig;
  private warpDir: string;

  constructor() {
    this.config = createPlatformConfig(
      'Warp',
      'https://api.warp.dev', // Warp API if available
      'WARP',
      { version: 'v1' }
    );

    // Warp stores config in ~/.warp
    this.warpDir = path.join(os.homedir(), '.warp');
  }

  /**
   * Check if Warp is installed
   */
  isInstalled(): boolean {
    const warpAppPaths = [
      '/Applications/Warp.app',                    // macOS
      path.join(os.homedir(), 'Applications', 'Warp.app'),
      '/usr/share/applications/warp-terminal.desktop', // Linux
    ];

    return warpAppPaths.some(p => {
      try {
        fs.accessSync(p);
        return true;
      } catch {
        return false;
      }
    });
  }

  /**
   * Ensure Warp config directory exists
   */
  private ensureWarpDir(): void {
    if (!fs.existsSync(this.warpDir)) {
      fs.mkdirSync(this.warpDir, { recursive: true });
    }
  }

  // =====================
  // Workflows
  // =====================

  /**
   * Get workflows directory
   */
  private getWorkflowsDir(): string {
    return path.join(this.warpDir, 'workflows');
  }

  /**
   * List all workflows
   */
  listWorkflows(): WarpWorkflow[] {
    const workflowsDir = this.getWorkflowsDir();

    if (!fs.existsSync(workflowsDir)) {
      return [];
    }

    const workflows: WarpWorkflow[] = [];
    const files = fs.readdirSync(workflowsDir);

    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        try {
          const content = fs.readFileSync(path.join(workflowsDir, file), 'utf-8');
          // Parse YAML (simplified - would use yaml library in production)
          const workflow = this.parseWorkflowYaml(content, file);
          if (workflow) {
            workflows.push(workflow);
          }
        } catch {
          // Skip invalid workflows
        }
      }
    }

    return workflows;
  }

  /**
   * Parse workflow YAML (simplified parser)
   */
  private parseWorkflowYaml(content: string, filename: string): WarpWorkflow | null {
    const lines = content.split('\n');
    const workflow: WarpWorkflow = {
      name: filename.replace(/\.ya?ml$/, ''),
      command: '',
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('name:')) {
        workflow.name = trimmed.substring(5).trim().replace(/^['"]|['"]$/g, '');
      } else if (trimmed.startsWith('command:')) {
        workflow.command = trimmed.substring(8).trim().replace(/^['"]|['"]$/g, '');
      } else if (trimmed.startsWith('description:')) {
        workflow.description = trimmed.substring(12).trim().replace(/^['"]|['"]$/g, '');
      }
    }

    return workflow.command ? workflow : null;
  }

  /**
   * Create a new workflow
   */
  createWorkflow(workflow: WarpWorkflow): void {
    this.ensureWarpDir();
    const workflowsDir = this.getWorkflowsDir();

    if (!fs.existsSync(workflowsDir)) {
      fs.mkdirSync(workflowsDir, { recursive: true });
    }

    const filename = `${workflow.name.toLowerCase().replace(/\s+/g, '-')}.yaml`;
    const filepath = path.join(workflowsDir, filename);

    let content = `name: "${workflow.name}"\n`;
    content += `command: "${workflow.command}"\n`;

    if (workflow.description) {
      content += `description: "${workflow.description}"\n`;
    }

    if (workflow.tags?.length) {
      content += `tags:\n`;
      for (const tag of workflow.tags) {
        content += `  - "${tag}"\n`;
      }
    }

    if (workflow.arguments?.length) {
      content += `arguments:\n`;
      for (const arg of workflow.arguments) {
        content += `  - name: "${arg.name}"\n`;
        if (arg.description) {
          content += `    description: "${arg.description}"\n`;
        }
        if (arg.defaultValue) {
          content += `    default_value: "${arg.defaultValue}"\n`;
        }
      }
    }

    fs.writeFileSync(filepath, content, 'utf-8');
  }

  /**
   * Delete a workflow
   */
  deleteWorkflow(workflowName: string): boolean {
    const workflowsDir = this.getWorkflowsDir();
    const filename = `${workflowName.toLowerCase().replace(/\s+/g, '-')}.yaml`;
    const filepath = path.join(workflowsDir, filename);

    try {
      fs.unlinkSync(filepath);
      return true;
    } catch {
      return false;
    }
  }

  // =====================
  // Themes
  // =====================

  /**
   * Get themes directory
   */
  private getThemesDir(): string {
    return path.join(this.warpDir, 'themes');
  }

  /**
   * List available themes
   */
  listThemes(): string[] {
    const themesDir = this.getThemesDir();

    if (!fs.existsSync(themesDir)) {
      return [];
    }

    return fs.readdirSync(themesDir)
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      .map(f => f.replace(/\.ya?ml$/, ''));
  }

  /**
   * Create a custom theme
   */
  createTheme(theme: WarpTheme): void {
    this.ensureWarpDir();
    const themesDir = this.getThemesDir();

    if (!fs.existsSync(themesDir)) {
      fs.mkdirSync(themesDir, { recursive: true });
    }

    const filename = `${theme.name.toLowerCase().replace(/\s+/g, '_')}.yaml`;
    const filepath = path.join(themesDir, filename);

    // Create YAML content for theme
    let content = `accent: "${theme.accent}"\n`;
    content += `background: "${theme.background}"\n`;
    content += `foreground: "${theme.foreground}"\n`;
    content += `details: "${theme.details}"\n`;
    content += `terminal_colors:\n`;
    content += `  normal:\n`;
    for (const [key, value] of Object.entries(theme.terminal_colors.normal)) {
      content += `    ${key}: "${value}"\n`;
    }
    content += `  bright:\n`;
    for (const [key, value] of Object.entries(theme.terminal_colors.bright)) {
      content += `    ${key}: "${value}"\n`;
    }

    fs.writeFileSync(filepath, content, 'utf-8');
  }

  // =====================
  // Launch Configurations
  // =====================

  /**
   * Get launch configs directory
   */
  private getLaunchConfigsDir(): string {
    return path.join(this.warpDir, 'launch_configurations');
  }

  /**
   * Create a launch configuration
   */
  createLaunchConfig(config: WarpLaunchConfig): void {
    this.ensureWarpDir();
    const configsDir = this.getLaunchConfigsDir();

    if (!fs.existsSync(configsDir)) {
      fs.mkdirSync(configsDir, { recursive: true });
    }

    const filename = `${config.name.toLowerCase().replace(/\s+/g, '_')}.yaml`;
    const filepath = path.join(configsDir, filename);

    let content = `name: "${config.name}"\n`;
    content += `windows:\n`;

    for (const window of config.windows) {
      content += `  - tabs:\n`;
      for (const tab of window.tabs) {
        content += `      - `;
        if (tab.title) content += `title: "${tab.title}"\n        `;
        if (tab.command) content += `command: "${tab.command}"\n        `;
        if (tab.workingDirectory) content += `working_directory: "${tab.workingDirectory}"\n        `;
        content += '\n';
      }
    }

    fs.writeFileSync(filepath, content, 'utf-8');
  }

  /**
   * List launch configurations
   */
  listLaunchConfigs(): string[] {
    const configsDir = this.getLaunchConfigsDir();

    if (!fs.existsSync(configsDir)) {
      return [];
    }

    return fs.readdirSync(configsDir)
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      .map(f => f.replace(/\.ya?ml$/, ''));
  }

  // =====================
  // AI & Suggestions
  // =====================

  /**
   * Generate AI-powered command suggestion
   * Note: This would integrate with Warp's AI features if API available
   */
  async suggestCommand(description: string): Promise<string[]> {
    // Placeholder - Warp's AI is built into the terminal
    // This could be extended if Warp provides an API
    console.log(`Would suggest commands for: ${description}`);
    return [
      `# Command suggestions for: ${description}`,
      '# (Warp AI suggestions available in Warp terminal)',
    ];
  }

  // =====================
  // BlackRoad Integration
  // =====================

  /**
   * Create BlackRoad-optimized workflow set
   */
  createBlackRoadWorkflows(): void {
    const workflows: WarpWorkflow[] = [
      {
        name: 'br-deploy',
        command: 'br deploy {{project}} --env {{environment}}',
        description: 'Deploy a BlackRoad project',
        tags: ['blackroad', 'deploy'],
        arguments: [
          { name: 'project', description: 'Project name' },
          { name: 'environment', description: 'Target environment', defaultValue: 'production' },
        ],
      },
      {
        name: 'br-logs',
        command: 'br logs {{service}} --follow',
        description: 'Stream logs from a BlackRoad service',
        tags: ['blackroad', 'logs'],
        arguments: [
          { name: 'service', description: 'Service name' },
        ],
      },
      {
        name: 'br-status',
        command: 'br status --all',
        description: 'Check status of all BlackRoad services',
        tags: ['blackroad', 'status'],
      },
      {
        name: 'br-mesh',
        command: 'br mesh connect {{node}}',
        description: 'Connect to BlackRoad mesh network',
        tags: ['blackroad', 'mesh'],
        arguments: [
          { name: 'node', description: 'Node address' },
        ],
      },
    ];

    for (const workflow of workflows) {
      this.createWorkflow(workflow);
    }
  }
}

export default WarpClient;
