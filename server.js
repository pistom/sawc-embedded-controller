const express = require('express');
const http = require("http");
const cors = require('cors');
const isPi = require('detect-rpi');
const { Server } = require("socket.io");
const { WaterMessage } = require('./types');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3001;
app.use(cors());

const { queues } = require('./controller/queues');
const { startWater, stopWater } = require('./controller/controller.js');
const { setGpio } = require('./devices/gpio.js');

io.on("connection", async (socket) => {
  console.log("A user connected");

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
        default:
          console.log('Unknown message action: ' + message.action);
      }
    });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});


app.get('/gpio/:number/:state', (req, res) => {
  setGpio(req.params.number, 'out', req.params.state === 'on' ? 1 : 0);
  res.json({ status: 'success' });
});

server.listen(port, () => {
  console.log(`SAWC controller listening on port ${port} (${isPi() ? 'ON' : 'OFF'} a Raspberry Pi)`);
})
