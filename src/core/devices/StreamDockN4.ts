import type { DeviceInfo } from "@/types";
import { StreamDock } from "@core/devices/StreamDock";
import type { DeviceTransport } from "@core/transport/DeviceTransport";

export class StreamDockN4 extends StreamDock {
  constructor(transport: DeviceTransport, deviceInfo: DeviceInfo) {
    super(transport, deviceInfo);
  }
}
