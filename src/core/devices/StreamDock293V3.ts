import { StreamDock } from "@core/devices/StreamDock";
import type {
  DeviceInfo,
  DeviceTransport,
} from "@core/transport/DeviceTransport";

export class StreamDock293V3 extends StreamDock {
  constructor(transport: DeviceTransport, deviceInfo: DeviceInfo) {
    super(transport, deviceInfo);
  }
}
