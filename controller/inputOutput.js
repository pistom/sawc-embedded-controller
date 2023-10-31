const { initOutput } = require('../devices/mcp23x17');

const devices = require('../devices').devices;

const outputOff = async (device, output) => {
  if (!devices[device]?.outputs[output]) {
    await initOutput(device, output);
  }
  devices[device].outputs[output].write(1);
}

const outputOn = async (device, output) => {
  if (!devices[device]?.outputs[output]) {
    await initOutput(device, output);
  }
  await devices[device].outputs[output].write(0);
}

module.exports = {
  outputOn,
  outputOff,
}