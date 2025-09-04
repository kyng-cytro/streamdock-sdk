import { DeviceManager, type StreamDock } from "./src";

const setupDevice = async (device: StreamDock) => {
  device.open();
  device.init();
  device.setKeyCallback((_deck, key, state) => {
    console.log(key, state);
  });
};

const main = async () => {
  const deviceManager = new DeviceManager();
  const devices = await deviceManager.enumerate();
  for (const device of devices) {
    await setupDevice(device);
  }
  deviceManager.on("deviceAdded", (device) => {
    console.log("device added", device.getInfo());
    setupDevice(device);
  });
  deviceManager.on("deviceRemoved", (device) => {
    console.log("device removed", device.getInfo());
  });
  deviceManager.listen();
};

main();
