import { DeviceManager } from "./src";

const main = async () => {
  const deviceManager = new DeviceManager();
  const devices = await deviceManager.enumerate();
  if (!devices.length) return;
  for (const device of devices) {
    device.open();
    device.init();
    device.setKeyCallback((_deck, key, state) => {
      console.log(key, state);
    });
  }
};

main();
