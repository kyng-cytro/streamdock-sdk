import { DeviceManager, type StreamDock } from "./src";

const setupDevice = async (device: StreamDock) => {
  device.open();
  device.init();
  device.setKeyCallback((deck, key, state) => {
    console.log("key", key, state);
  });
};

const main = async () => {
  const deviceManager = new DeviceManager();
  const monitor = await deviceManager.listen();
  monitor.on("added", async (device) => {
    console.log("device added");
    // await setupDevice(device);
  });
  monitor.on("test", () => {
    console.log("test");
  });
  // const monitor = await deviceManager.listen();
  // monitor.on("added", (device) => {
  //   console.log("device added");
  // });
};

main();
