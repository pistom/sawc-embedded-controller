const clearQueue = require('../queue/queue').clearQueue;

const startPump = async (device) => {
  const deviceType = require('../config').config.devices[device].type;
  const delay = require('../utils/filesUtils').getConfigFile().devices[device].outputs['pump'].delayOn || 0;
  const devices = require('../devices').devices;
  if (require('../config').config.devices[device].outputs['pump'].disabled) return;
  if (!devices[device]?.outputs['pump']) {
    await require(`../devices/${deviceType}`).initOutput(device, 'pump');
  }
  setTimeout(async () => {
    try {
      await devices[device]?.outputs['pump'].write(0);
    } catch (e) {
      await clearQueue(device, e);
    }
  }, delay);
}

const stopPump = async (device) => {
  const devices = require('../devices').devices;
  if (require('../config').config.devices[device].outputs['pump'].disabled) return;
  try {
    await devices[device]?.outputs['pump'].write(1);
  } catch (e) {
    await clearQueue(device, e);
  }
}

module.exports = {
  startPump,
  stopPump,
}