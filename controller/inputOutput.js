const clearQueue = require('../queue/queue').clearQueue;

const outputOff = async (device, output) => {
  const deviceType = require('../config').config.devices[device].type;
  const devices = require('../devices').devices;
  if (!devices[device]?.outputs[output]) {
    await require(`../devices/${deviceType}`).initOutput(device, output);
  }
  try {
    await devices[device].outputs[output].write(1);
  } catch (e) {
    await clearQueue(device, e);
  }
}

const outputOn = async (device, output) => {
  const deviceType = require('../config').config.devices[device].type;
  const devices = require('../devices').devices;
  if (!devices[device]?.outputs[output]) {
    await require(`../devices/${deviceType}`).initOutput(device, output);
  }
  try {
    const duration = require('../queue/queue').queues[device]?.queue[0]?.duration;
    await devices[device].outputs[output].write(0, duration);
  } catch (e) {
    await clearQueue(device, e);
  }
}

module.exports = {
  outputOn,
  outputOff,
}