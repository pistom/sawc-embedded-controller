const { initOutput } = require('../devices/mcp23x17');
const { initQueue, countDown, unqueue } = require('./queues');
const { sleep } = require('./utils');

const devices = require('../devices').devices;

/**
 * 
 * @param {string} device 
 * @param {string} output 
 * @param {number} duration 
 */
const startWater = async (device, output, duration) => {
  const queue = initQueue(device);
  queue.push({ output, duration });
  const timeSum = queue.reduce((acc, cur) => acc + cur.duration, 0);
  await sleep((timeSum - duration) + 1);

  if (!devices[device]?.outputs[output]) {
    await initOutput(device, output);
  }
  devices[device].outputs[output].write(1);
  await countDown(device);
  stopWater(device, output);
}

/**
 * 
 * @param {string} device 
 * @param {string} output 
 */
const stopWater = (device, output) => {
  unqueue(device, output);
}

module.exports = {
  startWater,
  stopWater,
}