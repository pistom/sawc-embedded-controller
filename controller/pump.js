const { initOutput } = require('../devices/mcp23x17');

const startPump = async (device) => {
  const delay = require('../utils/filesUtils').getConfigFile().devices[device].outputs['pump'].delayOn || 0;
  const devices = require('../devices').devices;
  if (require('../config').config.devices[device].outputs['pump'].disabled) return;
  if (!devices[device]?.outputs['pump']) {
    await initOutput(device, 'pump');
  }
  setTimeout(async () => {
    devices[device]?.outputs['pump'].write(0);
  }, delay);
}

const stopPump = async (device) => {
  const devices = require('../devices').devices;
  if (require('../config').config.devices[device].outputs['pump'].disabled) return;
  devices[device]?.outputs['pump'].write(1);
}

module.exports = {
  startPump,
  stopPump,
}