const { sleep } = require('../utils/sleep');

class Consumer {
  constructor(queues, device, io) {
    this.queues = queues;
    this.queue = queues[device];
    this.io = io;
    this.device = device;
  }

  async consume(finishCallback) {
    const { logWatering } = require('../utils/logsUtils');
    const queues = this.queues;
    const io = this.io;
    const device = this.device;
    const queue = queues[device];
    const delayOff = require('../utils/filesUtils').getConfigFile().devices[device].outputs['pump'].delayOff || 0;
    while (queue.queue.length > 0) {
      const { output, duration, startCallback, endCallback, dateTime, type, context } = queue.queue[0];
      queue.queue[0].status = 'running';
      startCallback(device, output);
      const message = { device, output, status: 'watering', duration, dateTime, type, context }
      io.emit('message', message);
      logWatering(message);
      queue.queue[0].sleep = sleep(duration);
      await queue.queue[0].sleep.promise;
      let error = false;
      if (queue.queue[0]?.error) {
        error = queue.queue[0].error;
      }
      if (queue.queue[0]?.output === output) {
        if(queue.queue[1]) {
          await endCallback(device, output);
        } else {
          setTimeout(async () => {
            await endCallback(device, output);
          }, delayOff);
        }
        queue.shift();
        error && (message.context = error.toString());
        const status = error ? 'error' : 'done';
        io.emit('message', { ...message, status});
        logWatering({ ...message, status});
      }
    }
    await finishCallback(device);
    delete queues[device];
  }
}

module.exports = { Consumer };