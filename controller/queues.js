const { sleep } = require('./utils');

const queues = {};

const initQueue = device => {
  if (!queues[device]) {
    queues[device] = [];
  }
  return queues[device];
}

const countDown = async device => {
  console.log(queues[device]);
  if (!queues[device]?.length) {
    return;
  }
  queues[device][0].duration--;
  if (queues[device][0].duration === 0) {
    queues[device].shift();
  } else {
    await sleep(1);
    await countDown(device);
  }
}

const unqueue = (device, output) => {
  console.log('unqueue', device, output);
  const queue = initQueue(device);
  const index = queue.findIndex(q => q.output === output);
  if (index !== -1) {
    queue.splice(index, 1);
  }
}

module.exports = {
  queues,
  initQueue,
  countDown,
  unqueue,
}