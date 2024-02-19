import { devices } from '../devices/index.js';
import { config } from '../config.js';
import { NetworkOutput } from '../devices/networkOutput.js';

const initDevice = async (device) => {
  devices[device] = devices[device] || {};
  devices[device].outputs = {};
}

const initOutput = async (device, output) => {
  if (!devices[device]) {
    await initDevice(device);
  }
  const deviceConfig = config.devices[device];
  if (!devices[device].outputs[output]) {
    devices[device].outputs[output] = new NetworkOutput(deviceConfig, output)
  }
}

const initInput = async (device) => {
}

export {
  initDevice,
  initOutput,
  initInput,
}