export interface DeviceInfo {
  path: string;
  vendorId: number;
  productId: number;
}

export interface ReadResult {
  key: number;
  status: number;
  buffer: Uint8Array;
  okResponse: string;
  ackResponse: string;
}

export abstract class DeviceTransport {
  // Basic device operations
  abstract open(path: string): Promise<void>;
  abstract close(): Promise<void>;
  abstract read(length?: number): Promise<ReadResult>;
  abstract write(data: Uint8Array, length: number): Promise<number>;
  abstract enumerate(vid: number, pid: number): Promise<DeviceInfo[]>;

  // Screen and display controls
  abstract setBrightness(percent: number): Promise<number>;
  abstract wakeScreen(): Promise<number>;
  abstract refresh(): Promise<number>;
  abstract switchMode(mode: keyof typeof DeviceMode): Promise<number>;

  // Background image management
  abstract setBackgroundImg(buffer: Uint8Array, size: number): Promise<number>;
  abstract setBackgroundImgDualDevice(path: string): Promise<number>;

  // Key image management
  abstract setKeyImg(path: string, key: number): Promise<number>;
  abstract setKeyImgDualDevice(path: string, key: number): Promise<number>;
  abstract setKeyImgDataDualDevice(path: string, key: number): Promise<number>;
  abstract keyClear(index: number): Promise<number>;
  abstract keyAllClear(): Promise<number>;

  // Device state management
  abstract getInputReport(length: number): Promise<Uint8Array>;
  abstract disconnected(): Promise<number>;
}

// Error types for device operations
export class DeviceError extends Error {
  constructor(
    message: string,
    public code: number,
  ) {
    super(message);
    this.name = "DeviceError";
  }
}

export class DeviceNotFoundError extends DeviceError {
  constructor(message = "Device not found") {
    super(message, -1);
    this.name = "DeviceNotFoundError";
  }
}

export class DeviceConnectionError extends DeviceError {
  constructor(message = "Failed to connect to device") {
    super(message, -2);
    this.name = "DeviceConnectionError";
  }
}

// Constants
export const DeviceMode = {
  NORMAL: 0,
  CONFIGURATION: 1,
  BOOTLOADER: 2,
} as const;

export const DeviceStatus = {
  SUCCESS: 0,
  ERROR: -1,
  TIMEOUT: -2,
  INVALID_PARAM: -3,
  NOT_SUPPORTED: -4,
  NOT_CONNECTED: -5,
} as const;
