import type {
  DeviceInfo,
  DeviceTransport,
} from "@core/transport/DeviceTransport";
import { StreamDock } from "@core/devices/StreamDock";

export class StreamDock293s extends StreamDock {
  constructor(transport: DeviceTransport, deviceInfo: DeviceInfo) {
    super(transport, deviceInfo);
  }
}
