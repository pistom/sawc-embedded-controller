import { getConfigFile } from '../utils/filesUtils.js';
import { logWatering } from '../utils/logsUtils.js';
import { sleep } from '../utils/sleep.js';

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
    const delayOff = getConfigFile().devices[device].outputs['pump'].delayOff || 0;
    while (queue.queue.length > 0) {
      const { output, duration, startCallback, endCallback, dateTime, type, context } = queue.queue[0];
      queue.queue[0].status = 'running';
      const message = { device, output, status: 'watering', duration, dateTime, type, context }
      try {
        await startCallback(device, output);
        io.emit('message', message);
        logWatering(message);
        queue.queue[0].sleep = sleep(duration);
        await queue.queue[0].sleep.promise;
        if (queue.queue[0]?.output === output) {
          if(queue.queue[1]) {
            await endCallback(device, output, queue.queue[1].output);
          } else {
            setTimeout(async () => {
              await endCallback(device, output);
            }, delayOff);
          }
          queue.shift();
          io.emit('message', { ...message, status: 'done'});
          logWatering({ ...message, status: 'done'});
        }
      } catch (error) {
        message.status = 'error';
        message.context = {...context, ...error};
        if (error.cause) {
          message.context = {...message.context, ...error.cause}
        }
        io.emit('message', message);
        logWatering(message);
        queue.shift();
        continue;
      }
    }
    try {
      await finishCallback(device);
    } catch (error) {
      console.error(error);
    }
    delete queues[device];
  }
}

export { Consumer };