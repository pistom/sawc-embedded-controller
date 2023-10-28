const { initOutput } = require('../devices/mcp23x17');
const { saveConfigFile, getConfigFile } = require('../utils/filesUtils');
const { sleep } = require('../utils/sleep');
const { Queue, Consumer } = require('./queues');

const devices = require('../devices').devices;
let isCalibrating = false ;
let calibrateSleep = null;

const setPinToHigh = async (device, output) => {
  if (!devices[device]?.outputs[output]) {
    await initOutput(device, output);
  }
  devices[device].outputs[output].write(1);
}

const setPinToLow = async (device, output) => {
  if (!devices[device]?.outputs[output]) {
    await initOutput(device, output);
  }
  await devices[device].outputs[output].write(0);
}

const startPump = async (device) => {
  if (!devices[device]?.outputs['pump']) {
    await initOutput(device, 'pump');
  }
  devices[device].outputs['pump'].write(0);
}
const stopPump = async (device) => {
  devices[device].outputs['pump'].write(1);
}

/**
 * 
 * @param {Object.<string, Queue>} queues 
 * @param {Object} message 
 * @param {import('socket.io').Server} io 
 */
const startWater = async (queues, message, io) => {
  if (isCalibrating) {
    io.emit('message', { status: 'calibratingError', device: message.device, output: message.output, message: 'Cannot start water while calibrating' });
  }
  const { device, output, volume } = message;
  if (!queues[device]) {
    await startPump(device);
    queues[device] = new Queue(device, io);
  }
  const queue = queues[device];
  queue.add(output, volume, setPinToLow, setPinToHigh);
  io.emit('message', { status: 'remainingTimes', device, remainingTimes: queue.getRemainingTimes() });
  if (!queue.consumer) {
    queue.consumer = new Consumer(queues, device, io);
    queue.consumer.consume(stopPump);
  }
}

/**
 * 
 * @param {Object.<string, Queue>} queues
 * @param {Object} message
 * @param {import('socket.io').Server} io
 */
const stopWater = async (queues, message, io) => {
  const { device, output } = message;
  const messageContent = { device, output, status: '', message: '' };
  if (!queues[device]) {
    messageContent.status = 'error';
    messageContent.message = 'No queue for device';
  } else {
    const queueElement = queues[device].unqueue(output);
    // Check if the output is in the queue
    if (queueElement) {
      // Checki if the output is currently set to on
      if (queueElement.status === 'running') {
        queueElement.sleep.abort();
        queueElement.endCallback(device, output);
        messageContent.status = 'stopped';
      } else {
        messageContent.status = 'aborted';
      }
    } else {
      messageContent.status = 'error';
      messageContent.message = 'No queue element for output';
    }
    if (queues[device].queue.length === 0) {
      stopPump(device);
    }
    io.emit('message', { status: 'remainingTimes', device, remainingTimes: queues[device].getRemainingTimes() });
    io.emit('message', messageContent);
  }
}

const getRemainingTimes = (queues, device, io) => {
  if (!queues[device]) {
    return {};
  }
  io.emit('message', {
    status: 'remainingTimes',
    device: device,
    remainingTimes: queues[device].getRemainingTimes()
  });
}

const editOutput = (message, io) => {
  const { device, output, name, image, defaultVolume, ratio } = message;
  const config = getConfigFile();
  name ? (config.devices[device].outputs[output].name = name) : delete config.devices[device].outputs[output].name;
  image ? (config.devices[device].outputs[output].image = image) : delete config.devices[device].outputs[output].image;
  defaultVolume ? (config.devices[device].outputs[output].defaultVolume = defaultVolume) : delete config.devices[device].outputs[output].defaultVolume;
  ratio ? (config.devices[device].outputs[output].ratio = ratio) : delete config.devices[device].outputs[output].ratio;
  saveConfigFile(config);
  require('../config.js').getConfig();
  io.emit('message', { status: 'configEdited', config})
}


const calibrate = async (queues, message, io) => {
  const { device, output } = message;
  const duration = require('../config').config.devices[device].settings.calibrateDuration;
  calibrateSleep = sleep(duration);
  if (isCalibrating) {
    io.emit('message', { status: 'calibratingError', device, output, message: 'Already calibrating' });
    return;
  }
  if (queues[device]?.queue.length > 0) {
    io.emit('message', { status: 'calibratingError', device, output, message: 'Cannot calibrate while queue is running' });
    return;
  }
  isCalibrating = true;
  await startPump(device);
  await setPinToLow(device, output);
  io.emit('message', { status: 'calibratingWaterStarted', duration, device, output });
  await calibrateSleep.promise
  await stopPump(device);
  if (isCalibrating) {
    await setPinToHigh(device, output);
    io.emit('message', { status: 'calibratingWaterStopped', duration, device, output });
    isCalibrating = false;
  }
}

const stopCalibrating = async (message, io) => {
  const { device, output } = message;
  if (isCalibrating) {
    calibrateSleep.abort();
    await setPinToHigh(device, output);
    io.emit('message', { status: 'calibratingWaterAborted', device, output });
    isCalibrating = false;
  }
}

const calculateRatio = (message, io) => {
  const { device, output, volume } = message;
  const duration = require('../config').config.devices[device].settings.calibrateDuration;
  const ratio = Number((volume / duration).toFixed(2));
  io.emit('message', { status: 'ratioCalculated', ratio, device, output });
}

module.exports = {
  startWater,
  stopWater,
  getRemainingTimes,
  editOutput,
  calibrate,
  stopCalibrating,
  calculateRatio,
}