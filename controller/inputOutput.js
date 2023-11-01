const { initOutput } = require('../devices/mcp23x17');

const outputOff = async (device, output) => {
  const devices = require('../devices').devices;
  if (!devices[device]?.outputs[output]) {
    await initOutput(device, output);
  }
  await devices[device].outputs[output].write(1);
}

const outputOn = async (device, output) => {
  const devices = require('../devices').devices;
  if (!devices[device]?.outputs[output]) {
    await initOutput(device, output);
  }
  await devices[device].outputs[output].write(0);
}

module.exports = {
  outputOn,
  outputOff,
}