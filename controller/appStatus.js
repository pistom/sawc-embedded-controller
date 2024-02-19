let workerLastHeartbeat = new Date();
let workerOnlineLastHeartbeat = new Date();
let workingSince = new Date();

const heartbeat = (message, io) => {
  if (message.process === 'worker') {
    workerLastHeartbeat = new Date();
  } else if (message.process === 'workeronline') {
    workerOnlineLastHeartbeat = new Date();
  }
  io.emit('message', message);
  return [workerLastHeartbeat, workerOnlineLastHeartbeat];
}

const getAppStatus = (message, io) => {
  const { type, context } = message;
  const messageContent = {
    status: 'appStatus',
    controller: {
      workingSince: workingSince,
      memoryUsage: `${Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100} MB` 
    },
    worker: {
      lastHeartbeat: workerLastHeartbeat,
    },
    workerOnline: {
      lastHeartbeat: workerOnlineLastHeartbeat,
    }
  }
  type && (messageContent.type = type);
  context && (messageContent.context = context);

  io.emit('message', messageContent);
}

export {
  heartbeat,
  getAppStatus,
}