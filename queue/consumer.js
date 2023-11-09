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
    const delayOff = require('../utils/filesUtils').getConfigFile().devices[device].outputs['pump'].delayOff || 0;
    while (queue.queue.length > 0) {
      const { output, duration, startCallback, endCallback, dateTime, type, context } = queue.queue[0];
      queue.queue[0].status = 'running';
      await startCallback(device, output);
      io.emit('message', { device, output, status: 'watering', duration, dateTime, type, context });
      queue.queue[0].sleep = sleep(duration);
      await queue.queue[0].sleep.promise;
      if (queue.queue[0]?.output === output) {
        if(queue.queue[1]) {
          await endCallback(device, output);
        } else {
          setTimeout(async () => {
            await endCallback(device, output);
          }, delayOff);
        }
        queue.shift();
        io.emit('message', { device, output, status: 'done', duration, dateTime, type, context });
      }
    }
    await finishCallback(device);
    delete queues[device];
  }
}

module.exports = { Consumer };