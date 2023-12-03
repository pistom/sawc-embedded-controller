const { Manager } = require("socket.io-client");
require('./config.js').getConfig();

let apiStatus = 'offline';
let apiToken = '';
let apiRefreshToken = '';
let apiUrl = '';
let apiUser = '';
let apiPassword = '';
let retryCount = 0;

const manager = new Manager("http://localhost:3001", {
  reconnectionDelayMax: 10000,
});

const socket = manager.socket("/", {
  auth: {
    token: require('./config.js').config.preferences?.token?.toString(),
  }
});

socket.on("connect", () => {
  console.log('Connected to server');
});
socket.on("welcome_message", (data) => {
  console.log(`Server says: ${data.message}`);
});

const getMemoryUsage = () => {
  if (!process.memoryUsage) return ('');
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  return `${Math.round(used * 100) / 100} MB`;
};

const loginToOnlineApi = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: apiUser, password: apiPassword })
    });
    const data = await response.json();
    if (data.code === 401) {
      apiStatus = data.message;
    } else if (response.ok) {
      apiToken = data.token;
      apiRefreshToken = data.refresh_token;
    }
  } catch (err) {
    apiStatus = 'offline';
  }
}

const refreshOnlineApiToken = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: apiRefreshToken })
    });
    const data = await response.json();
    if (data.code === 401) {
      apiStatus = data.message;
    } else if (response.ok) {
      apiToken = data.token;
      apiRefreshToken = data.refresh_token;
    }
  } catch (err) {
    apiStatus = 'offline';
  }
}

const requestToOnlineApi = async (endpoint, type = 'GET', body = null) => {
  let result = null;
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: type,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: body ? JSON.stringify(body) : null
    });
    const data = await response.json();
    if (!response.ok && data.code === 401 && retryCount < 3) {
      if (data.message === 'JWT Token not found') {
        await loginToOnlineApi();
      } else if (data.message === 'Invalid JWT Token') {
        await loginToOnlineApi();
      } else if (data.message === 'Expired JWT Token') {
        await refreshOnlineApiToken();
      }
      retryCount++;
      result = await requestToOnlineApi();
    }
    if (response.ok) {
      result = data;
      apiStatus = 'online';
      retryCount = 0;
    } else {
      if (data.status === "404") {
        apiStatus = data.detail;
      }
      socket.emit('message', { action: 'syslog', level: 'error', message: `Error while requesting online api: ${data.message}`, context: {endpoint, details: data.detail }});
    }
  } catch (err) {
    apiStatus = 'offline';
  }
  return result;
};

const getMessagesToProcessFromOnlineApi = async () => {
  return await requestToOnlineApi('/api/sawc/messages/process');
}

// Plants watering messages
socket.on("message", async (data) => {
  if (data.type === 'online') {
    const content = {
      action: data.context.action,
      status: data.status,
      sentToController: data.dateTime,
      updated: new Date(),
    }
    if (['START_WATER', 'STOP_WATER'].includes(data.context.onlineMessageAction)) {
      content.device = data.device;
      content.output = data.output;
      content.volume = data.context.volume;
      content.duration = data.duration;
    }
    switch (data.status) {
      case "watering":
        await requestToOnlineApi(`/api/sawc/messages/${data.context.onlineMessageId}`, 'POST', { content });
        break;
      case "done":
        await requestToOnlineApi(`/api/sawc/messages/${data.context.onlineMessageId}`, 'POST', { status: 'PROCESSED', content });
        break;
      case "stopped":
      case "aborted":
      case "stopError":
        await requestToOnlineApi(`/api/sawc/messages/${data.context.onlineMessageId}`, 'POST', { status: 'PROCESSED', content });
        break;
      case "appStatus":
        content.appStatuses = {
          controller: data.controller,
          worker: data.worker,
          workerOnline: data.workerOnline,
        }
        await requestToOnlineApi(`/api/sawc/messages/${data.context.onlineMessageId}`, 'POST', { status: 'PROCESSED', content });
        break;
    }
  }
});

const syncDevicesWithOnlineApi = async (devices) => {
  try {
    const response = await requestToOnlineApi(`/api/sawc/devices`, 'POST', devices);
    if (response?.success && response.createdPlants) {
      require('./config.js').getConfig();
      let configFileEdited = false;
      const config = require('./config.js').config;
      Object.keys(response.createdPlants).forEach(deviceId => {
        Object.keys(response.createdPlants[deviceId]).forEach(outputId => {
          config.devices[deviceId].outputs[outputId].onlinePlantsIds = [response.createdPlants[deviceId][outputId][0]];
          config.devices[deviceId].outputs[outputId].name = response.createdPlants[deviceId][outputId][1];
          configFileEdited = true;
        });
      });
      require('./config.js').saveConfig(config);
      require('./config.js').getConfig();
      configFileEdited && socket.emit('message', { action: 'configFileEdited'});
    } 
  } catch (err) {
    socket.emit('message', { action: 'syslog', level: 'error', message: `Error while syncing devices with online api: ${err.message}`, context: err.stack })
  }
}

const syncOutputsWithOnlineApi = async (deviceId, outputId, data) => {
  try {
    const response = await requestToOnlineApi(`/api/sawc/devices/${deviceId}/outputs/${outputId}`, 'POST', data);
    if (response?.success && response.createdPlant) {
      require('./config.js').getConfig();
      const config = require('./config.js').config;
      config.devices[deviceId].outputs[outputId].onlinePlantsIds = [response.createdPlant[0]];
      config.devices[deviceId].outputs[outputId].name = response.createdPlant[1];
      require('./config.js').saveConfig(config);
      require('./config.js').getConfig();
      socket.emit('message', { action: 'configFileEdited'});
    } 
  } catch (err) {
    socket.emit('message', { action: 'syslog', level: 'error', message: `Error while syncing output with online api: ${err.message}`, context: err.stack })
  }
}

socket.on("message", async (data) => {
  switch (data.status) {
    case "needToSyncDevicesWithOnlineApi":
      await syncDevicesWithOnlineApi(data.devices);
      break;
    case "needToSyncOutputWithOnlineApi":
      await syncOutputsWithOnlineApi(data.deviceId, data.outputId, data.data);
      break;
  }
});

const processMessages = async () => {
  const messages = await getMessagesToProcessFromOnlineApi();
  if (Array.isArray(messages)) {
    for (const message of messages) {
      context = {
        onlineMessageAction: message.action,
        onlineMessageId: message.id,
      }
      if (['START_WATER', 'STOP_WATER'].includes(message.action)) {
        context.volume = message.content.volume;
        context.action = message.content.action;
      }
      socket.emit('message', { ...message.content, type: 'online', context})
    }
  }
};

const getApiConfig = () => {
  require('./config.js').getConfig();
  const apiUrl = require('./config.js').config.preferences?.onlineApiUrl;
  const apiUser = require('./config.js').config.preferences?.onlineApiUser;
  const apiPassword = require('./config.js').config.preferences?.onlineApiPassword;
  return [apiUrl, apiUser, apiPassword];
}

const init = async () => {
  const [newApiUrl, newApiUser, newApiPassword] = getApiConfig();
  if (apiUrl !== newApiUrl || apiUser !== newApiUser || apiPassword !== newApiPassword) {
    apiUrl = newApiUrl;
    apiUser = newApiUser;
    apiPassword = newApiPassword;
    loginToOnlineApi();
    retryCount = 0;
  }
  if (!apiUrl || !apiUser || !apiPassword) return;
  processMessages();
}

setInterval(async () => {
  await init();
}, 2500);

setInterval(async () => {
  socket.emit('message', { action: 'heartbeat', process: 'workeronline', memory: getMemoryUsage(), onlineApiStatus: apiStatus });
}, 8000);

init();

socket.on("disconnect", () => {
  console.log('Disconnected from server');
});