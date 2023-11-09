const express = require('express');
const http = require("http");
const cors = require('cors');
const isPi = require('detect-rpi');
const { Server } = require("socket.io");
const { WaterMessage } = require('./types');

const port = process.env.NODE_ENV === 'test' ? 3301 : 3001;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {cors: {origin: true}});
app.use(cors({origin: true}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require('./config.js').getConfig();
const { queues } = require('./queue/queue.js');
const { getConfigFile, getScheduleFile } = require('./utils/filesUtils');
const authMiddleware = require('./middleware/auth.js');

const initServer = async () => {

  io.on("connection", async (socket) => {
    const requestToken = socket.handshake.auth.token;
    const token = require('./config.js').config.preferences?.token?.toString();
    if (token && requestToken !== token) {
      socket.emit('welcome_message', { status: 'error', message: 'Invalid token' });
      socket.disconnect();
      return;
    } else {
      socket.emit('welcome_message', { status: 'success', message: 'Hello' });
    }

    socket.on("message",
      /**
       * @param {WaterMessage} message
       * @param {function} cb
       * @returns {Promise<void>}
       */
      async (message, cb) => {
        switch (message.action) {
          case 'startWater':
            await require('./controller/wateringCan.js').startWater(queues, message, io);
            break;
          case 'stopWater':
            await require('./controller/wateringCan.js').stopWater(queues, message, io);
            break;
          case 'getRemainingTimes':
            require('./controller/wateringCan.js').getRemainingTimes(queues, message.device, io);
            break;
          case 'editOutput':
            require('./controller/wateringCan.js').editOutput(message, io);
            break;
          case 'editDevice':
            require('./controller/wateringCan.js').editDevice(message, io);
            break;
          case 'editDeviceOutput':
            require('./controller/wateringCan.js').editDeviceOutput(message, io);
            break;
          case 'calibrate':
            require('./controller/wateringCan.js').calibrate(queues, message, io);
            break;
          case 'stopCalibrating':
            require('./controller/wateringCan.js').stopCalibrating(message, io);
            break;
          case 'calculateRatio':
            require('./controller/wateringCan.js').calculateRatio(message, io);
            break;
          case 'heartbeat':
            require('./controller/heartbeat.js').heartbeat(message, io);
        }
        cb && cb(message.action);
      });

    // Handle disconnection
    socket.on("disconnect", () => {});
  });

  app.use(authMiddleware);
  app.get('/config', (req, res) => {
    res.json({ config: getConfigFile() });
  });

  app.get('/schedule', (req, res) => {
    res.json(getScheduleFile());
  });

  app.post('/schedule', (req, res) => {
    const eventData = req.body;
    res.json(require('./controller/schedule').saveScheduleEvent(eventData, 'add'));
  });

  app.put('/schedule', (req, res) => {
    const eventData = req.body;
    res.json(require('./controller/schedule').saveScheduleEvent(eventData, 'edit'));
  });

  app.delete('/schedule/:id', (req, res) => {
    const eventData = { id: req.params.id };
    res.json(require('./controller/schedule').saveScheduleEvent(eventData, 'delete'));
  });

  app.get('/gpio/:number/:state', (req, res) => {
    require('./devices/gpio').setGpio(req.params.number, 'out', req.params.state === 'on' ? 1 : 0);
    res.json({ status: 'success' });
  });

  app.post('/token', (req, res) => {
    const token = req.body.token;
    const { config } = require('./config.js');
    config.preferences.token = token;
    require('./config.js').saveConfig(config);
    res.json({ token: config.preferences.token });
  });

  return server;
};

const startServer = async () => {
  (await initServer()).listen(port, () => {
    console.log(`SAWC controller listening on port ${port} (${isPi() ? 'ON' : 'OFF'} a Raspberry Pi)`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = {
  app,
  io,
  initServer,
  startServer,
}