const { QueueType } = require('../types');
const { sleep } = require('../utils/sleep');

const queues = {};

/**
 * @type {QueueType}
 */
class Queue {
  constructor(device, io) {
    this.queue = [];
    this.device = device;
    this.io = io;
  }

  getLength() {
    return this.queue.length;
  }

  getRemainingTimes() {
    const outputs = {};
    let globalTime = 0;
    let elapsedTime = 0;
    for (const item of this.queue) {
      if (item.status === 'running') {
        elapsedTime = item.sleep?.elapsedTime()
      }
      globalTime += item.duration;
      outputs[item.output] = {
        wateringIn: parseFloat((globalTime - item.duration - elapsedTime).toFixed(2)),
        wateringTime: item.duration,
        wateringVolume: item.volume,
      };
    }
    return outputs;
  }

  convertToDuration(output, volume) {
    const device = require('../config').config.devices[this.device]
    if (volume > device.settings.maxVolumePerOutput) {
      volume = device.settings.maxVolumePerOutput;
    }
    const outputRatio = device.outputs[output].ratio || device.settings.defaultRatio;
    return Number((volume / outputRatio).toFixed(0));
  }

  add(output, volume, startCallback, endCallback, type = 'manual', dateTime = new Date(), context = null) {
    this.queue.push({ 
      output, 
      duration: this.convertToDuration(output, volume), 
      volume,
      startCallback, 
      endCallback,
      type,
      dateTime,
      context,
    });
  }

  unqueue(output) {
    const message = this.queue.find(item => item.output === output);
    this.queue = this.queue.filter(item => item.output !== output);
    return message;
  }

  shift() {
    return this.queue.shift();
  }
}

const clearQueue = async (device, error) => {
  const queues = require('../queue/queue').queues;
  const queue = queues[device];
  queue?.io && queue.io.emit('message', { status: 'Network module ERROR'});
  await sleep(0).promise;
  queue?.queue[0] && (queue.queue[0].error = error) && queue.queue[0].sleep?.resume();
  queue && delete queue.consumer;
  queues[device] && delete queues[device];
}

module.exports = {
  queues,
  Queue,
  clearQueue,
}