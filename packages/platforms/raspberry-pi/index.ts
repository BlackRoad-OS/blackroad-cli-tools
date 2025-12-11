/**
 * BlackRoad Platform Integration - Raspberry Pi
 *
 * MIT License
 * Copyright (c) 2025 BlackRoad OS, Inc.
 *
 * Raspberry Pi device management integration for:
 * - Remote device management via SSH
 * - GPIO control
 * - System monitoring
 * - Software deployment
 * - Cluster management (Pi clusters)
 */

import { createPlatformConfig, PlatformConfig } from '../core';

export interface RaspberryPiDevice {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  model: string;
  serialNumber: string;
  osVersion: string;
  kernelVersion: string;
  online: boolean;
  lastSeen: string;
  uptime: number;
  cpuTemperature: number;
  memoryUsage: { total: number; used: number; free: number };
  diskUsage: { total: number; used: number; free: number };
  gpioAvailable: number[];
  tags: string[];
}

export interface GPIOPin {
  pin: number;
  mode: 'input' | 'output' | 'pwm';
  state: 'high' | 'low';
  pullUpDown?: 'up' | 'down' | 'none';
  pwmFrequency?: number;
  pwmDutyCycle?: number;
}

export interface PiCluster {
  id: string;
  name: string;
  masterNode: string;
  workerNodes: string[];
  type: 'kubernetes' | 'docker-swarm' | 'custom';
  status: 'healthy' | 'degraded' | 'offline';
  createdAt: string;
}

export interface PiDeployment {
  id: string;
  deviceId: string;
  name: string;
  type: 'container' | 'binary' | 'script';
  status: 'running' | 'stopped' | 'failed' | 'deploying';
  image?: string;
  command?: string;
  ports?: Record<number, number>;
  environment?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface PiSystemInfo {
  hostname: string;
  model: string;
  revision: string;
  serial: string;
  os: {
    name: string;
    version: string;
    kernel: string;
    architecture: string;
  };
  cpu: {
    model: string;
    cores: number;
    frequency: number;
    temperature: number;
    usage: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
  };
  storage: Array<{
    device: string;
    mountPoint: string;
    fsType: string;
    total: number;
    used: number;
    free: number;
  }>;
  network: Array<{
    interface: string;
    ipAddress: string;
    macAddress: string;
    isUp: boolean;
  }>;
  uptime: number;
  loadAverage: [number, number, number];
}

/**
 * Raspberry Pi Fleet Manager
 *
 * Manages a fleet of Raspberry Pi devices via SSH or custom agent.
 *
 * Environment Variables:
 * - PI_FLEET_ENABLED: Set to 'true' to enable
 * - PI_SSH_KEY_PATH: Path to SSH private key
 * - PI_SSH_USER: SSH username (default: pi)
 * - PI_AGENT_PORT: Port for Pi agent communication (default: 8472)
 */
export class RaspberryPiClient {
  private config: PlatformConfig;
  private devices: Map<string, RaspberryPiDevice> = new Map();

  constructor() {
    this.config = createPlatformConfig(
      'RaspberryPi',
      'http://localhost:8472',
      'PI_FLEET',
      { version: 'v1', timeout: 10000 }
    );
  }

  /**
   * Register a new Pi device
   */
  registerDevice(device: Omit<RaspberryPiDevice, 'id' | 'online' | 'lastSeen'>): RaspberryPiDevice {
    const id = `pi-${device.serialNumber || Date.now()}`;
    const fullDevice: RaspberryPiDevice = {
      ...device,
      id,
      online: false,
      lastSeen: new Date().toISOString(),
    };
    this.devices.set(id, fullDevice);
    return fullDevice;
  }

  /**
   * List all registered devices
   */
  listDevices(): RaspberryPiDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get device by ID
   */
  getDevice(deviceId: string): RaspberryPiDevice | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Remove a device
   */
  removeDevice(deviceId: string): boolean {
    return this.devices.delete(deviceId);
  }

  /**
   * Execute command on device via SSH
   * NOTE: This is a placeholder - actual SSH implementation requires
   * additional libraries like ssh2 which should be added as dependencies
   */
  async executeCommand(deviceId: string, command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    // Validate command (basic injection protection)
    const dangerousPatterns = [
      /rm\s+-rf\s+\//,      // rm -rf /
      /:\(\)\{.*\}:/,       // fork bomb
      /mkfs\./,             // format commands
      /dd\s+if=.*of=\/dev/, // dangerous dd
      />\s*\/dev\/sd/,      // write to disk device
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        throw new Error('Potentially dangerous command blocked for safety');
      }
    }

    // Placeholder - would use SSH library in production
    console.log(`Would execute on ${device.hostname}: ${command}`);
    return {
      stdout: `Simulated output for: ${command}`,
      stderr: '',
      exitCode: 0,
    };
  }

  /**
   * Get system information from device
   */
  async getSystemInfo(deviceId: string): Promise<PiSystemInfo> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    // In production, this would SSH into the device and gather info
    return {
      hostname: device.hostname,
      model: device.model,
      revision: 'a03111',
      serial: device.serialNumber,
      os: {
        name: 'Raspbian',
        version: device.osVersion,
        kernel: device.kernelVersion,
        architecture: 'armv7l',
      },
      cpu: {
        model: 'BCM2711',
        cores: 4,
        frequency: 1500,
        temperature: device.cpuTemperature,
        usage: 15.5,
      },
      memory: device.memoryUsage,
      storage: [
        {
          device: '/dev/mmcblk0p2',
          mountPoint: '/',
          fsType: 'ext4',
          ...device.diskUsage,
        },
      ],
      network: [
        {
          interface: 'eth0',
          ipAddress: device.ipAddress,
          macAddress: 'b8:27:eb:xx:xx:xx',
          isUp: device.online,
        },
      ],
      uptime: device.uptime,
      loadAverage: [0.5, 0.4, 0.3],
    };
  }

  /**
   * Control GPIO pin
   */
  async setGPIO(deviceId: string, pin: GPIOPin): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    if (!device.gpioAvailable.includes(pin.pin)) {
      throw new Error(`GPIO pin ${pin.pin} is not available on this device`);
    }

    // Validate pin number (BCM numbering for Raspberry Pi)
    const validPins = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];
    if (!validPins.includes(pin.pin)) {
      throw new Error(`Invalid GPIO pin number: ${pin.pin}`);
    }

    console.log(`Setting GPIO ${pin.pin} to ${pin.mode}/${pin.state} on ${device.hostname}`);
  }

  /**
   * Read GPIO pin state
   */
  async readGPIO(deviceId: string, pinNumber: number): Promise<GPIOPin> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    // Placeholder - would read actual GPIO state
    return {
      pin: pinNumber,
      mode: 'input',
      state: 'low',
      pullUpDown: 'none',
    };
  }

  /**
   * Deploy application to device
   */
  async deploy(deviceId: string, deployment: Omit<PiDeployment, 'id' | 'createdAt' | 'updatedAt'>): Promise<PiDeployment> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const id = `deploy-${Date.now()}`;
    const now = new Date().toISOString();

    const fullDeployment: PiDeployment = {
      ...deployment,
      id,
      createdAt: now,
      updatedAt: now,
    };

    console.log(`Deploying ${deployment.name} to ${device.hostname}`);
    return fullDeployment;
  }

  /**
   * Create Pi cluster
   */
  createCluster(options: {
    name: string;
    masterNodeId: string;
    workerNodeIds: string[];
    type: PiCluster['type'];
  }): PiCluster {
    const master = this.devices.get(options.masterNodeId);
    if (!master) {
      throw new Error(`Master node ${options.masterNodeId} not found`);
    }

    for (const workerId of options.workerNodeIds) {
      if (!this.devices.has(workerId)) {
        throw new Error(`Worker node ${workerId} not found`);
      }
    }

    return {
      id: `cluster-${Date.now()}`,
      name: options.name,
      masterNode: options.masterNodeId,
      workerNodes: options.workerNodeIds,
      type: options.type,
      status: 'healthy',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Update device firmware/OS
   */
  async updateSystem(deviceId: string, options?: { reboot?: boolean }): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    console.log(`Updating system on ${device.hostname}`);
    // Would execute: sudo apt update && sudo apt upgrade -y
    if (options?.reboot) {
      console.log(`Rebooting ${device.hostname}`);
    }
  }

  /**
   * Reboot device
   */
  async reboot(deviceId: string): Promise<void> {
    await this.executeCommand(deviceId, 'sudo reboot');
  }

  /**
   * Shutdown device
   */
  async shutdown(deviceId: string): Promise<void> {
    await this.executeCommand(deviceId, 'sudo shutdown -h now');
  }
}

export default RaspberryPiClient;
