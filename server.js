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
const { queues } = require('./controller/queues');
const { getConfigFile, getScheduleFile } = require('./utils/filesUtils');

const initServer = async () => {

  io.on("connection", async (socket) => {
    socket.on("message",

      /**
       * @param {WaterMessage} message
       * @param {function} cb
       * @returns {Promise<void>}
       */
      async (message, cb) => {
        switch (message.action) {
          case 'startWater':
            await require('./controller/controller').startWater(queues, message, io);
            break;
          case 'stopWater':
            await require('./controller/controller').stopWater(queues, message, io);
            break;
          case 'getRemainingTimes':
            require('./controller/controller').getRemainingTimes(queues, message.device, io);
            break;
          case 'editOutput':
            require('./controller/controller').editOutput(message, io);
            break;
          case 'editDevice':
            require('./controller/controller').editDevice(message, io);
            break;
          case 'editDeviceOutput':
            require('./controller/controller').editDeviceOutput(message, io);
            break;
          case 'calibrate':
            require('./controller/controller').calibrate(queues, message, io);
            break;
          case 'stopCalibrating':
            require('./controller/controller').stopCalibrating(message, io);
            break;
          case 'calculateRatio':
            require('./controller/controller').calculateRatio(message, io);
            break;
        }
        cb && cb(message.action);
      });

    // Handle disconnection
    socket.on("disconnect", () => {});
  });

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