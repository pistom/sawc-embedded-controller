const { sleep } = require('../utils/sleep');
const { QueueType } = require('../types');
const { config } = require('../config');
/**
 * @type {Object.<string, QueueType>}
 */
const queues = {};

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
        elapsedTime = item.sleep.elapsedTime()
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

  add(output, volume, startCallback, endCallback) {
    this.queue.push({ 
      output, 
      duration: this.convertToDuration(output, volume), 
      volume, 
      startCallback, 
      endCallback 
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

class Consumer {
  constructor(queues, device, io) {
    this.queues = queues;
    this.queue = queues[device];
    this.io = io;
    this.device = device;
  }

  async consume(finishCallback) {
    const queues = this.queues;
    const io = this.io;
    const device = this.device;
    const queue = queues[device];
    while (queue.queue.length > 0) {
      const { output, duration, startCallback, endCallback } = queue.queue[0];
      queue.queue[0].status = 'running';
      startCallback(device, output);
      io.emit('message', { device, output, status: 'watering', duration });
      queue.queue[0].sleep = sleep(duration);
      await queue.queue[0].sleep.promise;
      if (queue.queue[0]?.output === output) {
        endCallback(device, output);
        queue.shift();
        io.emit('message', { device, output, status: 'done' });
      }
    }
    finishCallback(device);
    delete queues[device];
  }
}

module.exports = {
  queues,
  Queue,
  Consumer,
}