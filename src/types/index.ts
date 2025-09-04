export interface ImageFormat {
  format: string;
  rotation: number;
  size: readonly [number, number];
  flip: readonly [boolean, boolean];
}

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
