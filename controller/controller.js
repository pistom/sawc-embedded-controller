const { initOutput } = require('../devices/mcp23x17');
const { Queue, Consumer } = require('./queues');

const devices = require('../devices').devices;

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
  const { device, output, duration } = message;
  if (!queues[device]) {
    await startPump(device);
    queues[device] = new Queue(device, io);
  }
  const queue = queues[device];
  queue.add(output, duration, setPinToLow, setPinToHigh);
  io.emit('message', {status: 'remainingTimes', device, remainingTimes: queue.getRemainingTimes()});
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
  const messageContent = {device, output, status: '', message: ''};
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
    io.emit('message', {status: 'remainingTimes', device, remainingTimes: queues[device].getRemainingTimes()});
    io.emit('message', messageContent);
  }
}

module.exports = {
  startWater,
  stopWater,
}