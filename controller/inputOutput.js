const outputOff = async (device, output) => {
  const deviceType = require('../config').config.devices[device].type;
  const devices = require('../devices').devices;
  if (!devices[device]?.outputs[output]) {
    await require(`../devices/${deviceType}`).initOutput(device, output);
  }
  try {
    await devices[device].outputs[output].write(1);
  } catch (e) {
    console.error(e.cause);
  }
}

const outputOn = async (device, output) => {
  const deviceType = require('../config').config.devices[device].type;
  const devices = require('../devices').devices;
  if (!devices[device]?.outputs[output]) {
    await require(`../devices/${deviceType}`).initOutput(device, output);
  }
  const duration = require('../queue/queue').queues[device]?.queue[0]?.duration;
  await devices[device].outputs[output].write(0, duration);
}

module.exports = {
  outputOn,
  outputOff,
}