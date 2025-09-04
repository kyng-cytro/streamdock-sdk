import type { DeviceInfo } from "@/types";
import { StreamDock } from "@core/devices/StreamDock";
import type { DeviceTransport } from "@core/transport/DeviceTransport";

export class StreamDock293s extends StreamDock {
  constructor(transport: DeviceTransport, deviceInfo: DeviceInfo) {
    super(transport, deviceInfo);
  }
}
