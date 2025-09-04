import { processImage } from "@/utils/image";
import { StreamDock } from "@core/devices/StreamDock";
import {
  DeviceStatus,
  type DeviceInfo,
  type DeviceTransport,
} from "@core/transport/DeviceTransport";

export class StreamDockN3 extends StreamDock {
  constructor(transport: DeviceTransport, deviceInfo: DeviceInfo) {
    super(transport, deviceInfo);
  }

  async setTouchscreenImage(path: string): Promise<number> {
    const image = await processImage(path, this.touchscreenImageFormat());
    if (!image) return DeviceStatus.ERROR;
    try {
      return this.transport.setBackgroundImgDualDevice(image.path);
    } catch (error) {
      console.error("[set-touchscreen-image] Error:", error);
      return DeviceStatus.ERROR;
    } finally {
      image.cleanup();
    }
  }

  async setKeyImage(path: string, key: number): Promise<number> {
    const image = await processImage(path, this.keyImageFormat());
    if (!image) return DeviceStatus.ERROR;
    try {
      return this.transport.setKeyImgDualDevice(image.path, key);
    } catch (error) {
      console.error("[set-key-image] Error:", error);
      return DeviceStatus.ERROR;
    } finally {
      image.cleanup();
    }
  }

  async getSerialNumber(length: number): Promise<Uint8Array> {
    return this.transport.getInputReport(length);
  }

  private keyImageFormat() {
    return {
      rotation: 90,
      format: "JPEG",
      size: [64, 64] as const,
      flip: [false, false] as const,
    };
  }

  private touchscreenImageFormat() {
    return {
      rotation: 90,
      format: "JPEG",
      size: [320, 240] as const,
      flip: [false, false] as const,
    };
  }
}
