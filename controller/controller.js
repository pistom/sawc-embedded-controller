const { sleep } = require('../utils/sleep');
const { outputOn, outputOff } = require('./inputOutput');
const { startPump, stopPump } = require('./pump');
const { Queue, Consumer } = require('./queues');

const calibrating = require('./calibrating');

/**
 * 
 * @param {Object.<string, Queue>} queues 
 * @param {Object} message 
 * @param {import('socket.io').Server} io 
 */
const startWater = async (queues, message, io) => {
  const calibrating = require('./calibrating');
  if (calibrating.isCalibrating) {
    io.emit('message', { status: 'calibratingError', device: message.device, output: message.output, message: 'Cannot start water while calibrating' });
    return;
  }
  const { device, output, volume } = message;
  if (!queues[device]) {
    await startPump(device);
    queues[device] = new Queue(device, io);
  }
  const queue = queues[device];
  queue.add(output, volume, outputOn, outputOff);
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
        setTimeout(async () => {
          queueElement.endCallback(device, output);
        }, 500);
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
  }
  io.emit('message', messageContent);
}

const getRemainingTimes = (queues, device, io) => {
  if (!queues[device]) {
    return {};
  }
  const remainingTimes = queues[device].getRemainingTimes()
  io.emit('message', {
    status: 'remainingTimes',
    device: device,
    remainingTimes
  });
  return remainingTimes;
}

const editOutput = (message, io) => {
  const { device, output, name, image, defaultVolume, ratio } = message;
  const config = require('../utils/filesUtils').getConfigFile();
  name ? (config.devices[device].outputs[output].name = name) : delete config.devices[device].outputs[output].name;
  image ? (config.devices[device].outputs[output].image = image) : delete config.devices[device].outputs[output].image;
  defaultVolume ? (config.devices[device].outputs[output].defaultVolume = defaultVolume) : delete config.devices[device].outputs[output].defaultVolume;
  ratio ? (config.devices[device].outputs[output].ratio = ratio) : delete config.devices[device].outputs[output].ratio;
  require('../utils/filesUtils').saveConfigFile(config);
  require('../config.js').getConfig();
  io.emit('message', { status: 'configEdited', config})
}

const editDevice = (message, io) => {
  const { device, name, defaultVolume, defaultRatio, maxVolumePerOutput, calibrateDuration } = message;
  const config = require('../utils/filesUtils').getConfigFile();
  name ? (config.devices[device].name = name) : (config.devices[device].name = device);
  defaultRatio ? (config.devices[device].settings.defaultRatio = defaultRatio) : delete config.devices[device].settings.defaultRatio;
  defaultVolume ? (config.devices[device].settings.defaultVolume = defaultVolume) : delete config.devices[device].settings.defaultVolume;
  maxVolumePerOutput ? (config.devices[device].settings.maxVolumePerOutput = maxVolumePerOutput) : delete config.devices[device].settings.maxVolumePerOutput;
  calibrateDuration ? (config.devices[device].settings.calibrateDuration = calibrateDuration) : delete config.devices[device].settings.calibrateDuration;
  require('../utils/filesUtils').saveConfigFile(config);
  require('../config.js').getConfig();
  io.emit('message', { status: 'configEdited', config})
}

const editDeviceOutput = (message, io) => {
  const { device, output, pin, disabled } = message;
  const config = require('../utils/filesUtils').getConfigFile();
  disabled !== undefined && (config.devices[device].outputs[output].disabled = disabled);
  pin >= 0 && (config.devices[device].outputs[output].pin = pin);
  require('../utils/filesUtils').saveConfigFile(config);
  require('../config.js').getConfig();
  io.emit('message', { status: 'configOutputEdited', config, device, output})
}

const calibrate = async (queues, message, io) => {
  const calibrating = require('./calibrating');
  const { device, output } = message;
  const duration = require('../config').config.devices[device].settings.calibrateDuration;
  calibrating.calibrateSleep = sleep(duration);
  if (calibrating.isCalibrating) {
    io.emit('message', { status: 'calibratingError', device, output, message: 'Already calibrating' });
    return;
  }
  if (queues[device]?.queue.length > 0) {
    io.emit('message', { status: 'calibratingError', device, output, message: 'Cannot calibrate while queue is running' });
    return;
  }
  calibrating.isCalibrating = true;
  await startPump(device);
  await outputOn(device, output);
  io.emit('message', { status: 'calibratingWaterStarted', duration, device, output });
  await calibrating.calibrateSleep.promise
  await stopPump(device);
  if (calibrating.isCalibrating) {
    await outputOff(device, output);
    io.emit('message', { status: 'calibratingWaterStopped', duration, device, output });
    calibrating.isCalibrating = false;
  }
}

const stopCalibrating = async (message, io) => {
  const calibrating = require('./calibrating');
  const { device, output } = message;
  if (calibrating.isCalibrating) {
    calibrating.calibrateSleep.abort();
    await stopPump(device);
    await outputOff(device, output);
    io.emit('message', { status: 'calibratingWaterAborted', device, output });
    calibrating.isCalibrating = false;
  }
}

const calculateRatio = (message, io) => {
  const { device, output, volume } = message;
  const duration = require('../config').config.devices[device].settings.calibrateDuration;
  const ratio = Number((volume / duration).toFixed(2));
  io.emit('message', { status: 'ratioCalculated', ratio, device, output });
  return ratio;
}

module.exports = {
  startWater,
  stopWater,
  getRemainingTimes,
  editOutput,
  editDevice,
  editDeviceOutput,
  calibrate,
  stopCalibrating,
  calculateRatio,
}