import { DeviceManager, type StreamDock } from "./src";

const setupDevice = async (device: StreamDock) => {
  device.open();
  device.init();
  device.setKeyCallback((_deck, key, state) => {
    console.log("The key", key, "was pressed", state);
  });
};

const main = async () => {
  const deviceManager = new DeviceManager();
  const monitor = await deviceManager.listen({ emitExisting: true });
  monitor.on("added", async (device) => {
    setupDevice(device);
  });
};

main();
