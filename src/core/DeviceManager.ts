import type { StreamDock } from "@core/devices/StreamDock";
import { products } from "@core/ProductsIDs";
import type { DeviceTransport } from "@core/transport/DeviceTransport";
import { LibUSBHIDTransport } from "@core/transport/LibUSBHIDTransport";
import { EventEmitter } from "events";
import * as HID from "node-hid";

export interface DeviceMonitorEvents {
  test: () => void;
  added: (device: StreamDock) => void;
}

export class DeviceMonitor extends EventEmitter {
  private closeHandler: () => void;
  constructor(closeHandler: () => void) {
    super();
    this.closeHandler = closeHandler;
  }
  override on<U extends keyof DeviceMonitorEvents>(
    event: U,
    listener: DeviceMonitorEvents[U],
  ): this {
    return super.on(event, listener);
  }
  close(): void {
    this.removeAllListeners();
    this.closeHandler();
  }
}

export class DeviceManager {
  #transport: DeviceTransport;
  #devices: StreamDock[] = [];

  private static _getTransport(): DeviceTransport {
    return new LibUSBHIDTransport();
  }

  constructor(transport?: DeviceTransport) {
    this.#transport = transport || DeviceManager._getTransport();
  }

  getDevices(): StreamDock[] {
    return this.#devices;
  }

  async enumerate(): Promise<StreamDock[]> {
    for (const [vid, pid, DeviceClass] of products) {
      const foundDevices = await this.#transport.enumerate(vid, pid);
      const newDevices = foundDevices.map(
        (device) => new DeviceClass(this.#transport, device),
      );
      this.#devices.push(...newDevices);
    }
    return this.#devices;
  }

  async listen(): Promise<DeviceMonitor> {
    const monitor = new DeviceMonitor(() => cleanup());
    const onAttach = async (info: HID.Device) => {
      for (const [vid, pid, DeviceClass] of products) {
        if (vid == info.vendorId && pid == info.productId) {
          const foundDevices = await this.#transport.enumerate(
            info.vendorId,
            info.productId,
          );
          for (const dev of foundDevices) {
            const device = new DeviceClass(this.#transport, dev);
            const path = device.getInfo().path;
            // Skip devices with the same path
            if (this.#devices.some((d) => d.getInfo().path === path)) continue;
            this.#devices.push(device);
            monitor.emit("added", device);
          }
        }
      }
    };

    monitor.emit("test");
    // Enumerate existing devices first
    // const devices = await this.enumerate();
    // for (const device of devices) {
    //   monitor.emit("added", device);
    // }

    const interval = setInterval(async () => {
      const all = HID.devices();
      const wanted = all
        .filter((d) => d.usagePage !== undefined && d.usagePage >= 0xff00)
        .filter((d) =>
          products.some((p) => d.vendorId == p[0] && d.productId == p[1]),
        );
      wanted.map((info) => onAttach(info));
    }, 1000);
    const cleanup = () => {
      clearInterval(interval);
      for (const device of this.#devices) {
        try {
          device.close();
        } catch (e) {
          console.error("[device-manager] Failed to close device", device, e);
        }
      }
    };

    return monitor;
  }
}
