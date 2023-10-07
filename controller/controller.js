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

/**
 * 
 * @param {Object.<string, Queue>} queues 
 * @param {Object} message 
 * @param {import('socket.io').Server} io 
 */
const startWater = async (queues, message, io) => {
  const { device, output, duration } = message;
  if (!queues[device]) {
    queues[device] = new Queue(device);
  }
  const queue = queues[device];
  queue.add(output, duration, setPinToHigh, setPinToLow);
  if (!queue.consumer) {
    queue.consumer = new Consumer(queues, device, io);
    queue.consumer.consume();
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
      // Checki if the output is currently on
      if (queueElement.status === 'running') {
        queueElement.endCallback(device, output);
        messageContent.status = 'stopped';
      } else {
        messageContent.status = 'aborted';
      }
    } else {
      messageContent.status = 'error';
      messageContent.message = 'No queue element for output';
    }
    io.emit('message', messageContent);
  }
}

module.exports = {
  startWater,
  stopWater,
}