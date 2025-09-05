import {
  DeviceError,
  DeviceMode,
  DeviceStatus,
  type DeviceInfo,
  type ReadResult,
} from "@/types";
import { DeviceTransport } from "@core/transport/DeviceTransport";
import {
  CString,
  dlopen,
  FFIType,
  ptr,
  read,
  toArrayBuffer,
  type Pointer,
} from "bun:ffi";
import { arch, platform } from "os";
import path from "path";

const getDllPath = () => {
  const libs = {
    win32: {
      x64: "libtransport.dll",
    },
    linux: {
      x64: "libtransport.so",
      arm64: "libtransport_arm64.so",
    },
    darwin: {
      x64: "libtransport.dylib",
      arm64: "libtransport_arm64.dylib",
    },
  };
  const os = platform() as keyof typeof libs;
  const architecture = arch() as keyof (typeof libs)[typeof os];
  const lib = libs[os]?.[architecture];
  if (!lib) {
    throw new Error(`Unsupported platform/architecture: ${os}/${architecture}`);
  }
  return path.join(__dirname, "libs", lib);
};

const FFIConfig = {
  TranSport_new: {
    args: [],
    returns: FFIType.ptr,
  },
  TranSport_destory: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  TranSport_open_: {
    args: [FFIType.ptr, FFIType.cstring],
    returns: FFIType.i32,
  },
  TranSport_setBrightness: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
  TranSport_read: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.u64],
    returns: FFIType.i32,
  },
  TranSport_read_: {
    args: [FFIType.ptr, FFIType.u64],
    returns: FFIType.ptr,
  },
  TranSport_deleteRead_: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  TranSport_write: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.u64],
    returns: FFIType.i32,
  },
  TranSport_getInputReport: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  TranSport_freeEnumerate: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  TranSport_enumerate: {
    args: [FFIType.ptr, FFIType.i32, FFIType.i32],
    returns: FFIType.ptr,
  },
  TranSport_setBackgroundImg: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
  TranSport_setBackgroundImgDualDevice: {
    args: [FFIType.ptr, FFIType.cstring],
    returns: FFIType.i32,
  },
  TranSport_setKeyImg: {
    args: [FFIType.ptr, FFIType.cstring, FFIType.i32],
    returns: FFIType.i32,
  },
  TranSport_setKeyImgDualDevice: {
    args: [FFIType.ptr, FFIType.cstring, FFIType.i32],
    returns: FFIType.i32,
  },
  TranSport_setKeyImgDataDualDevice: {
    args: [FFIType.ptr, FFIType.cstring, FFIType.i32],
    returns: FFIType.i32,
  },
  TranSport_keyClear: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
  TranSport_keyAllClear: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  TranSport_wakeScreen: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  TranSport_refresh: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  TranSport_disconnected: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  TranSport_close: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  TranSport_switchMode: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
};

export class LibUSBHIDTransport extends DeviceTransport {
  #symbols: any;
  #transport: number;
  #isDeviceOpen: boolean = false;

  constructor() {
    super();
    const { symbols } = this.initializeFFI();
    this.#symbols = symbols;
    this.#transport = this.#symbols.TranSport_new();
  }

  async open(path: string): Promise<void> {
    this.#isDeviceOpen = true;
    return this.#symbols.TranSport_open_(this.#transport, this.encode(path));
  }

  async close(): Promise<void> {
    this.#symbols.TranSport_close(this.#transport);
  }

  async read(length: number = 13): Promise<ReadResult> {
    this.assertDeviceOpen();
    const result = this.#symbols.TranSport_read_(this.#transport, length);
    if (!result) {
      throw new DeviceError("Failed to read from device", DeviceStatus.ERROR);
    }
    const buffer = new Uint8Array(toArrayBuffer(result, 0, length));
    const ackResponse = this.parseCString(buffer.subarray(0, 4));
    const okResponse = this.parseCString(buffer.subarray(5, 7));
    const key = buffer[9] as number;
    const status = buffer[10] as number;
    this.#symbols.TranSport_deleteRead_(result);
    return {
      key,
      status,
      okResponse,
      ackResponse,
      buffer: new Uint8Array(buffer),
    };
  }

  async write(data: Uint8Array, length: number): Promise<number> {
    this.assertDeviceOpen();
    return this.#symbols.TranSport_write(this.#transport, ptr(data), length);
  }

  async enumerate(vid: number, pid: number): Promise<DeviceInfo[]> {
    const devices: DeviceInfo[] = [];
    const enumPtr = this.#symbols.TranSport_enumerate(
      this.#transport,
      vid,
      pid,
    );
    if (!enumPtr) return devices;
    let currentPtr = enumPtr;
    while (currentPtr) {
      devices.push({
        vendorId: vid,
        productId: pid,
        path: this.readPath(currentPtr),
      });
      currentPtr = this.#symbols.next;
    }
    this.#symbols.TranSport_freeEnumerate(this.#transport, enumPtr);
    return devices;
  }

  async setBrightness(percent: number): Promise<number> {
    this.assertDeviceOpen();
    return this.#symbols.TranSport_setBrightness(this.#transport, percent);
  }

  async wakeScreen(): Promise<number> {
    this.assertDeviceOpen();
    return this.#symbols.TranSport_wakeScreen(this.#transport);
  }

  async refresh(): Promise<number> {
    this.assertDeviceOpen();
    return this.#symbols.TranSport_refresh(this.#transport);
  }

  async switchMode(mode: keyof typeof DeviceMode): Promise<number> {
    this.assertDeviceOpen();
    return this.#symbols.TranSport_switchMode(
      this.#transport,
      DeviceMode[mode],
    );
  }

  async setBackgroundImg(buffer: Uint8Array, size: number): Promise<number> {
    this.assertDeviceOpen();
    return this.#symbols.TranSport_setBackgroundImg(
      this.#transport,
      ptr(buffer),
      size,
    );
  }

  async setBackgroundImgDualDevice(path: string): Promise<number> {
    this.assertDeviceOpen();
    return this.#symbols.TranSport_setBackgroundImgDualDevice(
      this.#transport,
      Buffer.from(this.encode(path)),
    );
  }

  async setKeyImg(path: string, key: number): Promise<number> {
    this.assertDeviceOpen();
    return this.#symbols.TranSport_setKeyImg(
      this.#transport,
      Buffer.from(this.encode(path)),
      key,
    );
  }

  async setKeyImgDualDevice(path: string, key: number): Promise<number> {
    this.assertDeviceOpen();
    return this.#symbols.TranSport_setKeyImgDualDevice(
      this.#transport,
      Buffer.from(this.encode(path)),
      key,
    );
  }

  async setKeyImgDataDualDevice(path: string, key: number): Promise<number> {
    this.assertDeviceOpen();
    return this.#symbols.TranSport_setKeyImgDataDualDevice(
      this.#transport,
      Buffer.from(this.encode(path)),
      key,
    );
  }

  async keyClear(index: number): Promise<number> {
    this.assertDeviceOpen();
    return this.#symbols.TranSport_keyClear(this.#transport, index);
  }

  async keyAllClear(): Promise<number> {
    this.assertDeviceOpen();
    return this.#symbols.TranSport_keyAllClear(this.#transport);
  }

  async getInputReport(length: number): Promise<Uint8Array> {
    this.assertDeviceOpen();
    return new Uint8Array(
      this.#symbols.TranSport_getInputReport(this.#transport, length),
    );
  }

  async disconnected(): Promise<number> {
    return this.#symbols.TranSport_disconnected(this.#transport);
  }

  private assertDeviceOpen() {
    if (!this.#isDeviceOpen) {
      throw new DeviceError("Device is not open", DeviceStatus.ERROR);
    }
  }

  private parseCString(buf: Uint8Array): string {
    const idx = buf.indexOf(0);
    const slice = idx >= 0 ? buf.subarray(0, idx) : buf;
    return new TextDecoder().decode(slice);
  }

  private encode(value: any): Buffer {
    return Buffer.from(new TextEncoder().encode(value));
  }

  private initializeFFI() {
    return dlopen(getDllPath(), FFIConfig);
  }

  private readPath(ptr: Pointer): string {
    const OFF_PATH = 0;
    const pathPtr = read.ptr(ptr, OFF_PATH);
    return pathPtr ? new CString(pathPtr as Pointer).toString() : "";
  }
}
