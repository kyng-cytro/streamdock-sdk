import type {
  DeviceInfo,
  DeviceTransport,
} from "@core/transport/DeviceTransport";

type KeyCallback = (deck: StreamDock, key: number, state: number) => void;
type AsyncKeyCallback = (
  deck: StreamDock,
  key: number,
  state: number,
) => Promise<void>;

interface KeyMapping {
  [key: number]: number;
}

export class StreamDock {
  /*
   * Represents a physically attached StreamDock device.
   */

  protected device: DeviceInfo;
  private keyCallback?: KeyCallback;
  private readThread?: NodeJS.Timeout;
  protected transport: DeviceTransport;
  private runReadThread: boolean = false;
  private static readonly KEY_MAPPING: KeyMapping = {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 15,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    11: 1,
    12: 2,
    13: 3,
    14: 4,
    15: 5,
  };

  constructor(transport: DeviceTransport, deviceInfo: DeviceInfo) {
    this.device = deviceInfo;
    this.transport = transport;
  }

  open() {
    return this.transport.open(this.device.path);
  }

  init() {
    this.wakeScreen();
    this.setBrightness(100);
    this.clearAllIcons();
    this.refresh();
  }

  read() {
    return this.transport.read();
  }

  getPath(): string {
    return this.device.path;
  }

  getInfo(): DeviceInfo {
    return this.device;
  }

  refresh() {
    return this.transport.refresh();
  }

  wakeScreen() {
    return this.transport.wakeScreen();
  }

  setBrightness(percent: number) {
    return this.transport.setBrightness(percent);
  }

  clearAllIcons() {
    return this.transport.keyAllClear();
  }

  disconnected() {
    return this.transport.disconnected();
  }

  setKeyCallback(callback: KeyCallback): void {
    this.keyCallback = callback;
    this._setupReader(() => this._read());
  }

  setKeyCallbackAsync(
    asyncCallback: AsyncKeyCallback,
    eventLoop: any = undefined,
  ): void {
    const dispatcher = eventLoop
      ? (fn: Function) => eventLoop.run(() => fn())
      : setImmediate;
    this.setKeyCallback((deck, key, state) => {
      dispatcher(() => {
        asyncCallback(deck, key, state).catch((error) => {
          console.error("[async-key-callback] Error:", error);
        });
      });
    });
  }

  async close(): Promise<void> {
    try {
      if (this.readThread) {
        this.runReadThread = false;
        clearInterval(this.readThread);
        this.readThread = undefined;
      }
      await this.clearAllIcons();
      await this.disconnected();
      await this.transport.close();
    } catch (error) {
      console.error("[close] Error closing device:", error);
      throw error;
    }
  }

  /**
   * Can be used with 'with' statement in TypeScript
   */
  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }

  private mapKey(k: number): number {
    return StreamDock.KEY_MAPPING[k] || k;
  }

  private async _read(): Promise<void> {
    while (this.runReadThread) {
      try {
        const data = await this.transport.read();
        if (data.buffer.length >= 10) {
          if (data.key === 255) {
            console.log("[write] Successful");
          } else {
            const mappedKey = this.mapKey(data.key);
            let newState = data.status;
            if (this.keyCallback) {
              this.keyCallback(this, mappedKey, newState);
            }
          }
        }
      } catch (error) {
        this.runReadThread = false;
        await this.close();
        console.error("[read] Read error:", error);
      }
    }
  }

  private _setupReader(callback?: () => Promise<void>): void {
    if (this.readThread) {
      this.runReadThread = false;
      clearInterval(this.readThread);
      this.readThread = undefined;
    }
    if (callback) {
      this.runReadThread = true;
      this.readThread = setInterval(() => {
        callback().catch((error) => {
          console.error("[read] Reader thread error:", error);
          this.runReadThread = false;
          this._setupReader();
        });
      }, 100);
    }
  }
}
