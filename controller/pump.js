const { initOutput } = require('../devices/mcp23x17');

const startPump = async (device) => {
  const devices = require('../devices').devices;
  if (require('../config').config.devices[device].outputs['pump'].disabled) return;
  if (!devices[device]?.outputs['pump']) {
    await initOutput(device, 'pump');
  }
  devices[device].outputs['pump'].write(0);
}

const stopPump = async (device) => {
  const devices = require('../devices').devices;
  if (require('../config').config.devices[device].outputs['pump'].disabled) return;
  devices[device].outputs['pump'].write(1);
}

module.exports = {
  startPump,
  stopPump,
}