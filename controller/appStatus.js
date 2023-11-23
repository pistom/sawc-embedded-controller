let workerLastHeartbeat = new Date();
let workerOnlineLastHeartbeat = new Date();
let workingSince = new Date();

const heartbeat = (message, io) => {
  if (message.process === 'worker') {
    workerLastHeartbeat = new Date();
  } else if (message.process === 'workerOnline') {
    workerOnlineLastHeartbeat = new Date();
  }
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
      lastHeartbeat: workerLastHeartbeat,
    },
    workerOnline: {
      lastHeartbeat: workerOnlineLastHeartbeat,
    }
  });
}

module.exports = {
  heartbeat,
  getAppStatus,
}