import { config } from '../config.js';
import { getConfigFile } from '../utils/filesUtils.js';
import { devices } from '../devices/index.js';

const startPump = async (device) => {
  const deviceType = config.devices[device].type;
  const delay = getConfigFile().devices[device].outputs['pump'].delayOn || 0;
  if (config.devices[device].outputs['pump'].disabled) return;
  if (!devices[device]?.outputs['pump']) {
    const module = await import(`../devices/${deviceType}.js`);
    await module.initOutput(device, 'pump');
  }
  setTimeout(async () => {
    try {
      await devices[device]?.outputs['pump'].write(0);
    } catch (e) {}
  }, delay);
}

const stopPump = async (device) => {
  if (config.devices[device].outputs['pump'].disabled) return;
  try {
    await devices[device]?.outputs['pump'].write(1);
  } catch (e) {}
}

export {
  startPump,
  stopPump,
}