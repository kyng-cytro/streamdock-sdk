import type { StreamDock } from "@core/devices/StreamDock";
import { products } from "@core/ProductsIDs";
import type { DeviceTransport } from "@core/transport/DeviceTransport";
import { LibUSBHIDTransport } from "@core/transport/LibUSBHIDTransport";
import * as HID from "node-hid";

export class DeviceManager {
  private transport: DeviceTransport;
  private devices: StreamDock[] = [];

  private static _getTransport(): DeviceTransport {
    return new LibUSBHIDTransport();
  }

  constructor(transport?: DeviceTransport) {
    this.transport = transport || DeviceManager._getTransport();
  }

  async enumerate(): Promise<StreamDock[]> {
    for (const [vid, pid, DeviceClass] of products) {
      const foundDevices = await this.transport.enumerate(vid, pid);
      const newDevices = foundDevices.map(
        (device) => new DeviceClass(this.transport, device),
      );
      this.devices.push(...newDevices);
    }
    return this.devices;
  }

  async listen(): Promise<() => void> {
    const tracked = new Map<string, { dev: HID.HID; info: HID.Device }>();

    const makeKey = (d: {
      vendorId: number;
      productId: number;
      path?: string;
    }) => `${d.vendorId}:${d.productId}:${d.path}`;

    const onAttach = async (info: HID.Device) => {
      for (const [vid, pid, DeviceClass] of products) {
        if (vid == info.vendorId && pid == info.productId) {
          const foundDevices = await this.transport.enumerate(
            info.vendorId,
            info.productId,
          );
          const newDevices = foundDevices.map(
            (device) => new DeviceClass(this.transport, device),
          );
          this.devices.push(...newDevices);
        }
      }
      console.log("[added] new devices");
    };

    const onDetach = (info: HID.Device) => {
      for (const device of this.devices) {
        const { vendorId, productId } = device.getInfo();
        if (vendorId == info.vendorId && productId == info.productId) {
          console.log("[removed] path:", device.getPath());
          this.devices.splice(this.devices.indexOf(device), 1);
          break;
        }
      }
    };

    const interval = setInterval(async () => {
      const all = HID.devices();
      const wanted = all
        .filter((d) => d.usagePage !== undefined && d.usagePage >= 0xff00)
        .filter((d) =>
          products.some((p) => d.vendorId == p[0] && d.productId == p[1]),
        );

      // Handle new devices
      for (const info of wanted) {
        const key = makeKey(info);
        if (!tracked.has(key)) {
          try {
            const dev = new HID.HID(info.path!);
            tracked.set(key, { dev, info });
            onAttach(info);
            dev.on("error", () => {
              dev.close();
              tracked.delete(key);
              onDetach(info);
            });
          } catch (err) {
            console.error("[device-manager] Failed to open device", info, err);
          }
        }
      }

      // Handle detached devices
      for (const [key, { dev, info }] of [...tracked.entries()]) {
        if (!wanted.some((w) => makeKey(w) == key)) {
          dev.close();
          tracked.delete(key);
          onDetach(info);
        }
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      for (const { dev } of tracked.values()) {
        try {
          dev.close();
        } catch (e) {}
      }
      tracked.clear();
    };
  }
}
