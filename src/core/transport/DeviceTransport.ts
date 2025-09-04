import type { DeviceInfo, DeviceMode, ReadResult } from "@/types";

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
