const { QueueType } = require('../types');

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

module.exports = {
  queues,
  Queue,
}