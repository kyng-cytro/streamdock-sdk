import type {
  DeviceInfo,
  DeviceTransport,
} from "@core/transport/DeviceTransport";
import { StreamDock } from "@core/devices/StreamDock";

export class StreamDockN4 extends StreamDock {
  constructor(transport: DeviceTransport, deviceInfo: DeviceInfo) {
    super(transport, deviceInfo);
  }
}
