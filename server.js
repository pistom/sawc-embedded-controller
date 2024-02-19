import express from 'express';
import http from "http";
import cors from 'cors';
import isPi from 'detect-rpi';
import { Server } from "socket.io";
import { config, getConfig, saveConfig } from './config.js';
import { calculateRatio, calibrate, configFileEdited, editDevice, editDeviceOutput, editOutput, getRemainingTimes, startWater, stopCalibrating, stopWater } from './controller/wateringCan.js';
import { setGpio } from './devices/gpio.js'

const port = process.env.NODE_ENV === 'test' ? 3301 : 3001;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {cors: {origin: true}});
import authMiddleware from './middleware/auth.js';
app.use(cors({origin: true}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

getConfig();
import { queues } from './queue/queue.js';
import { getConfigFile, getScheduleFile } from './utils/filesUtils.js';
import { getAppStatus, heartbeat } from './controller/appStatus.js';
import { saveScheduleEvent } from './controller/schedule.js';
import { getLogs } from './utils/logsUtils.js';

const initServer = async () => {

  io.on("connection", async (socket) => {
    const requestToken = socket.handshake.auth.token;
    const token = config.preferences?.token?.toString();
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
            await startWater(queues, message, io);
            break;
          case 'stopWater':
            await stopWater(queues, message, io);
            break;
          case 'getRemainingTimes':
            getRemainingTimes(queues, message.device, io);
            break;
          case 'editOutput':
            editOutput(message, io);
            break;
          case 'editDevice':
            editDevice(message, io);
            break;
          case 'editDeviceOutput':
            editDeviceOutput(message, io);
            break;
          case 'calibrate':
            calibrate(queues, message, io);
            break;
          case 'stopCalibrating':
            stopCalibrating(message, io);
            break;
          case 'calculateRatio':
            calculateRatio(message, io);
            break;
          case 'heartbeat':
            heartbeat(message, io);
            break;
          case 'getAppStatus':
            getAppStatus(message, io);
            break;
          case 'configFileEdited':
            configFileEdited(io);
            break;
          case 'syslog':
            syslog(message);
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
    res.json(saveScheduleEvent(eventData, 'add'));
  });

  app.put('/schedule', (req, res) => {
    const eventData = req.body;
    res.json(saveScheduleEvent(eventData, 'edit'));
  });

  app.delete('/schedule/:id', (req, res) => {
    const eventData = { id: req.params.id };
    res.json(saveScheduleEvent(eventData, 'delete'));
  });

  app.get('/gpio/:number/:state', (req, res) => {
    setGpio(req.params.number, 'out', req.params.state === 'on' ? 1 : 0);
    res.json({ status: 'success' });
  });

  app.post('/token', (req, res) => {
    const token = req.body.token;
    config.preferences.token = token;
    saveConfig(config);
    res.json({ token: config.preferences.token });
  });

  app.get('/logs/:type', (req, res) => {
    const type = req.params.type;
    const date = req.query.date || null;
    const days = req.query.days || 7;
    res.json(getLogs(type, date, days));
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

export {
  app,
  io,
  initServer,
  startServer,
}