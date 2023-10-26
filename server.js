const express = require('express');
const http = require("http");
const cors = require('cors');
const isPi = require('detect-rpi');
const { Server } = require("socket.io");
const { WaterMessage } = require('./types');

const port = 3001;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {cors: {origin: true}});
app.use(cors({origin: true}));

const { queues } = require('./controller/queues');
const { startWater, stopWater, getRemainingTimes, editOutput } = require('./controller/controller.js');
const { setGpio } = require('./devices/gpio.js');
const { getConfigFile } = require('./utils/filesUtils');

io.on("connection", async (socket) => {
  socket.on("message",
    /**
     * @param {WaterMessage} message
     * @returns {Promise<void>}
     */
    async (message) => {
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
      }
    });

  // Handle disconnection
  socket.on("disconnect", () => {});
});

app.get('/config', (req, res) => {
  res.json({ config: getConfigFile() });
});

app.get('/gpio/:number/:state', (req, res) => {
  setGpio(req.params.number, 'out', req.params.state === 'on' ? 1 : 0);
  res.json({ status: 'success' });
});

server.listen(port, () => {
  console.log(`SAWC controller listening on port ${port} (${isPi() ? 'ON' : 'OFF'} a Raspberry Pi)`);
})
