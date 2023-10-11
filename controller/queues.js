const { sleep } = require('./utils');
const { QueueType } = require('../types')

/**
 * @type {Object.<string, QueueType>}
 */
const queues = {};

class Queue {
  constructor(device) {
    this.queue = [];
    this.device = device;
  }

  add(output, duration, startCallback, endCallback) {
    this.queue.push({ output, duration, startCallback, endCallback });
  }

  unqueue(output) {
    const message = this.queue.find(item => item.output === output);
    this.queue = this.queue.filter(item => item.output !== output);
    return message;
  }

  shift() {
    // console.log('shift', this.queue)
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