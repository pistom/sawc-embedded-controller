const { sleep } = require('../utils/sleep');

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
        const delayOff = require('../utils/filesUtils').getConfigFile().devices[device].outputs['pump'].delayOff || 0;
        setTimeout(async () => {
          await endCallback(device, output);
        }, delayOff);
        queue.shift();
        io.emit('message', { device, output, status: 'done' });
      }
    }
    await finishCallback(device);
    delete queues[device];
  }
}

module.exports = { Consumer };