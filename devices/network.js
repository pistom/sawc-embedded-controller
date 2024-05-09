const initDevice = async (device) => {
  const devices = require('../devices').devices;

  devices[device] = devices[device] || {};
  devices[device].outputs = {};
}

const initOutput = async (device, output) => {
  const devices = require('../devices').devices;
  if (!devices[device]) {
    await initDevice(device);
  }
  const deviceConfig = require('../config').config.devices[device];
  if (!devices[device].outputs[output]) {
    const NetworkOutput = require('./networkOutput');
    devices[device].outputs[output] = new NetworkOutput(deviceConfig, output)
  }
}

const initInput = async (device) => {
}

module.exports = {
  initDevice,
  initOutput,
  initInput,
}