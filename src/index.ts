import { DeviceManager } from "@core/DeviceManager";
import { StreamDockN3 } from "@/core/devices";

async function main() {
  try {
    const manager = new DeviceManager();
    const docks = await manager.enumerate();
    // manager.listen();
    console.log(`Found ${docks.length} Stream Dock(s).\n`);
    for (const dock of docks) {
      dock.open();
      dock.init();
      dock.setKeyCallback((_, k, s) => {
        console.log(`Key ${k} state ${s}`);
      });
      if (dock instanceof StreamDockN3) {
        dock.setTouchscreenImage("touchscreen.png");
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
  }
}

main();
