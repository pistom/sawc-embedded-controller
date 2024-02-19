import { config } from "../config.js";
import { devices } from "../devices/index.js";
import { queues } from "../queue/queue.js";

const outputOff = async (device, output, nextOutput = null) => {
  const deviceType = config.devices[device].type;
  if (!devices[device]?.outputs[output]) {
    const module = await import(`../devices/${deviceType}.js`);
    await module.initOutput(device, output);
  }
  try {
    await devices[device].outputs[output].write(1, null, nextOutput);
  } catch (e) {
    console.error(e.cause);
  }
}

const outputOn = async (device, output) => {
  const deviceType = config.devices[device].type;
  if (!devices[device]?.outputs[output]) {
    const module = await import(`../devices/${deviceType}.js`);
    await module.initOutput(device, output);
  }
  const duration = queues[device]?.queue[0]?.duration;
  await devices[device].outputs[output].write(0, duration);
}

export {
  outputOn,
  outputOff,
}