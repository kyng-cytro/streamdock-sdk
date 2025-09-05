# StreamDock SDK

> ⚠️ **Warning**: This is an unofficial SDK and is not affiliated with, endorsed by, or connected to StreamDock or its parent company. Use at your own risk.

A TypeScript SDK for interacting with StreamDock devices, built with Bun runtime.

## Features

- Support for multiple StreamDock device models:
  - StreamDock 293 Series (293, 293s, 293V3)
  - StreamDock N Series (N1, N3, N4)
- Image handling capabilities:
  - Set background images
  - Configure key icons
  - Image processing with automatic rotation and resizing
- Device management:
  - Hot-plug detection
  - Multiple device support
  - Automatic device enumeration
- Event handling:
  - Key press callbacks
  - Async event support
  - Custom event dispatching

## Requirements

- [Bun](https://bun.sh) v1.2.19 or higher
- Supported operating systems:
  - Windows (x64)
  - Linux (x64, arm64)
  - macOS (x64, arm64)

## Installation

```bash
bun install
```

## Usage

### Basic Example

```typescript
import { DeviceManager } from "streamdock-sdk";

const main = async () => {
  // Create a device manager instance
  const deviceManager = new DeviceManager();

  // Find all connected devices
  const devices = await deviceManager.enumerate();

  if (!devices.length) {
    console.log("No devices found");
    return;
  }

  // Initialize each device
  for (const device of devices) {
    // Connect to the device
    await device.open();

    // Initialize with default settings
    device.init();

    // Set up key press handling
    device.setKeyCallback((deck, key, state) => {
      console.log(`Key ${key} ${state ? "pressed" : "released"}`);
    });
  }
};

main();
```

### Device Monitoring

```typescript
const deviceManager = new DeviceManager();

// Start monitoring for device connections/disconnections
const mointor = await deviceManager.listen({ emitExisting: true });

// When a device is connected
mointor.on("added", (device) => {
  console.log("Device added", device.getInfo());
});

// Listen for device disconnections
mointor.on("removed", (device) => {
  console.log("Device removed", device.getInfo());
});

// Stop monitoring
mointor.close();
```

### Setting Images

```typescript
// For N3 devices with touchscreen
if (device instanceof StreamDockN3) {
  // Set touchscreen background
  await device.setTouchscreenImage("path/to/background.jpg");

  // Set key icon
  await device.setKeyImage("path/to/icon.jpg", 1); // 1 is the key number
}
```

## API Reference

### DeviceManager

The main entry point for device discovery and management.

```typescript
class DeviceManager {
  // Get all connected devices
  getDevices(): StreamDock[];

  // Find all connected devices
  async enumerate(): Promise<StreamDock[]>;

  // Monitor for device connections/disconnections
  async listen({
    emitExisting,
  }: {
    emitExisting?: boolean;
  }): Promise<DeviceMonitor>;
}
```

### StreamDock

Base class for all StreamDock devices with common functionality.

```typescript
class StreamDock {
  // Device initialization
  open(): Promise<void>;
  init(): void;

  // Display controls
  setBrightness(percent: number): Promise<number>;
  wakeScreen(): Promise<number>;
  refresh(): Promise<number>;

  // Key handling
  setKeyCallback(
    callback: (deck: StreamDock, key: number, state: number) => void,
  ): void;
  setKeyCallbackAsync(
    callback: (deck: StreamDock, key: number, state: number) => Promise<void>,
  ): void;

  // Cleanup
  close(): Promise<void>;
}
```

## Known Issues

- For some reason, reconnecting a device after it has been disconnected causes a crash similar to sending a read command before the device is open. I suspect this happens because the device is storing some unexecuted events that get triggered upon reconnection.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This is an unofficial SDK and is not affiliated with StreamDock. Use at your own risk. All trademarks are the property of their respective owners.
