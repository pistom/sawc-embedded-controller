const { sleep } = require('../utils/sleep.js');
const { outputOn, outputOff } = require('./inputOutput.js');
const { startPump, stopPump } = require('./pump.js');
const { Queue } = require('../queue/queue.js');
const { Consumer } = require('../queue/consumer.js');

/**
 * 
 * @param {Object.<string, Queue>} queues 
 * @param {Object} message 
 * @param {import('socket.io').Server} io 
 */
const startWater = async (queues, message, io) => {
  const calibrating = require('./calibrating.js');
  if (calibrating.isCalibrating) {
    io.emit('message', { status: 'calibratingError', device: message.device, output: message.output, message: 'Cannot start water while calibrating' });
    return;
  }
  const { device, output, volume, type, dateTime, context } = message;
  if (!queues[device]) {
    try {
      await startPump(device);
    } catch (e) {
      console.error(e)
    }
    queues[device] = new Queue(device, io);
  }
  const queue = queues[device];
  queue.add(output, volume, outputOn, outputOff, type, dateTime, context);
  io.emit('message', { status: 'remainingTimes', device, remainingTimes: queue.getRemainingTimes() });
  if (!queue.consumer) {
    queue.consumer = new Consumer(queues, device, io);
    await queue.consumer.consume(stopPump);
  }
}

/**
 * 
 * @param {Object.<string, Queue>} queues
 * @param {Object} message
 * @param {import('socket.io').Server} io
 */
const stopWater = async (queues, message, io) => {
  const { logWatering } = require('../utils/logsUtils');
  const { device, output, type, context } = message;
  const messageContent = { device, output, status: '', message: '', type, context };
  if (!queues[device]) {
    messageContent.status = 'stopError';
    messageContent.message = 'No queue for device';
  } else {
    const queueElement = queues[device].unqueue(output);
    // Check if the output is in the queue
    if (queueElement) {
      // Checki if the output is currently set to on
      if (queueElement.status === 'running') {
        queueElement.sleep?.resume();
        const delayOff = require('../utils/filesUtils').getConfigFile().devices[device].outputs['pump'].delayOff || 0;
        setTimeout(async () => {
          try {
            queueElement.endCallback(device, output);
          } catch (e) {
            console.error('yoyyo')
          }
        }, delayOff);
        messageContent.status = 'stopped';
      } else {
        messageContent.status = 'aborted';
      }
      logWatering({ ...messageContent })
    } else {
      messageContent.status = 'stopError';
      messageContent.message = 'No queue element for output';
    }
    if (queues[device].queue.length === 0) {
      try {
        stopPump(device);
      } catch(e) {
        console.error(e)
      }
    }
    io.emit('message', { status: 'remainingTimes', device, remainingTimes: queues[device].getRemainingTimes() });
  }
  type && (messageContent.type = type);
  context && (messageContent.context = context);
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
  const { device, output, name, image, defaultVolume, ratio, sync, disabled, onlinePlantsIds, type, context } = message;
  const config = require('../utils/filesUtils.js').getConfigFile();
  const needToSync = config.devices[device].outputs[output].sync || sync;

  name !== undefined && (config.devices[device].outputs[output].name = name);
  name === '' && config.devices[device].outputs[output]?.name === '' && delete config.devices[device].outputs[output].name;

  image !== undefined && (config.devices[device].outputs[output].image = image);
  image === '' && config.devices[device].outputs[output]?.image && delete config.devices[device].outputs[output].image;

  defaultVolume !== undefined && (config.devices[device].outputs[output].defaultVolume = defaultVolume);
  defaultVolume === 0 && config.devices[device].outputs[output]?.defaultVolume && delete config.devices[device].outputs[output].defaultVolume;

  ratio !== undefined && (config.devices[device].outputs[output].ratio = ratio);
  ratio === 0 && config.devices[device].outputs[output]?.ratio && delete config.devices[device].outputs[output].ratio;

  disabled !== undefined && (config.devices[device].outputs[output].disabled = disabled); 

  sync !== undefined && (config.devices[device].outputs[output].sync = sync)
  sync === false && config.devices[device].outputs[output]?.onlinePlantsIds && delete config.devices[device].outputs[output].onlinePlantsIds;

  onlinePlantsIds !== undefined && (config.devices[device].outputs[output].onlinePlantsIds = onlinePlantsIds);
  onlinePlantsIds?.length === 0 && config.devices[device].outputs[output]?.onlinePlantsIds && delete config.devices[device].outputs[output].onlinePlantsIds;

  require('../utils/filesUtils.js').saveConfigFile(config);
  require('../config.js').getConfig();

  const messageContent = { config };
  type && (messageContent.type = type);
  context && (messageContent.context = context);

  io.emit('message', { status: 'configEdited', ...messageContent})
  needToSync && io.emit('message', { status: 'needToSyncOutputWithOnlineApi', deviceId: device, outputId: output, data: config.devices[device].outputs[output]})
}

const editDevice = (message, io) => {
  const { device, name, defaultVolume, defaultRatio, maxVolumePerOutput, calibrateDuration } = message;
  const config = require('../utils/filesUtils.js').getConfigFile();
  name ? (config.devices[device].name = name) : (config.devices[device].name = device);
  defaultRatio ? (config.devices[device].settings.defaultRatio = defaultRatio) : delete config.devices[device].settings.defaultRatio;
  defaultVolume ? (config.devices[device].settings.defaultVolume = defaultVolume) : delete config.devices[device].settings.defaultVolume;
  maxVolumePerOutput ? (config.devices[device].settings.maxVolumePerOutput = maxVolumePerOutput) : delete config.devices[device].settings.maxVolumePerOutput;
  calibrateDuration ? (config.devices[device].settings.calibrateDuration = calibrateDuration) : delete config.devices[device].settings.calibrateDuration;
  require('../utils/filesUtils.js').saveConfigFile(config);
  require('../config.js').getConfig();
  io.emit('message', { status: 'configEdited', config});
  io.emit('message', { status: 'needToSyncDevicesWithOnlineApi', devices: config.devices});
}

const editDeviceOutput = (message, io) => {
  const { device, output, pin, disabled } = message;
  const config = require('../utils/filesUtils.js').getConfigFile();
  disabled !== undefined && (config.devices[device].outputs[output].disabled = disabled);
  pin >= 0 && (config.devices[device].outputs[output].pin = pin);
  require('../utils/filesUtils.js').saveConfigFile(config);
  require('../config.js').getConfig();
  io.emit('message', { status: 'configOutputEdited', config, device, output})
  io.emit('message', { status: 'needToSyncDevicesWithOnlineApi', devices: config.devices});
}

const calibrate = async (queues, message, io) => {
  const calibrating = require('./calibrating.js');
  const { device, output } = message;
  const duration = require('../config.js').config.devices[device].settings.calibrateDuration;
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
  calibrating.calibrateSleep.promise.then(async () => {
    await stopPump(device);
    await outputOff(device, output);
    io.emit('message', { status: 'calibratingWaterStopped', duration, device, output });
    calibrating.isCalibrating = false;
  }).catch(async () => {
    calibrating.isCalibrating = false;
    await stopPump(device);
    await outputOff(device, output);
    io.emit('message', { status: 'calibratingWaterAborted', duration, device, output });
  });
}

const stopCalibrating = async (message, io) => {
  const calibrating = require('./calibrating.js');
  if (calibrating.isCalibrating) {
    calibrating.calibrateSleep.cancel();
  }
}

const calculateRatio = (message, io) => {
  const { device, output, volume, date } = message;
  const duration = require('../config.js').config.devices[device].settings.calibrateDuration;
  const ratio = Number((volume / duration).toFixed(2));
  io.emit('message', { status: 'ratioCalculated', ratio, device, output });
  return ratio;
}

const configFileEdited = io => {
  const config = require('../utils/filesUtils.js').getConfigFile();
  io.emit('message', { status: 'configFileEdited', config})
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
  configFileEdited,
}