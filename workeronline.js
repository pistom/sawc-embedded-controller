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
    }
  } catch (err) {
    apiStatus = 'offline';
  }
  return result;
};

const getMessagesFromOnlineApi = async () => {
  return await requestToOnlineApi('/api/sawc/messages');
}

const processMessages = async () => {
  const messages = await getMessagesFromOnlineApi();
  if (Array.isArray(messages)) {
    for (const message of messages) {
      await requestToOnlineApi(`/api/sawc/messages/${message.id}`, 'PUT', { status: 'processed' });
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
}, 10000);

setInterval(async () => {
  socket.emit('message', { action: 'heartbeat', process: 'workeronline', memory: getMemoryUsage(), onlineApiStatus: apiStatus });
}, 5000);

init();

socket.on("disconnect", () => {
  console.log('Disconnected from server');
});