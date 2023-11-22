let lastHeartbeat = new Date();
let workingSince = new Date();

const heartbeat = (message, io) => {
  lastHeartbeat = new Date();
  io.emit('message', message);
}

const getAppStatus = (message, io) => {
  io.emit('message', {
    status: 'appStatus',
    controller: {
      workingSince,
      memoryUsage: `${Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100} MB` 
    },
    worker: {
      lastHeartbeat,
    }
  });
}

module.exports = {
  heartbeat,
  getAppStatus,
}