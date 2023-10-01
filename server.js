const express = require('express');
const cors = require('cors');
const isPi = require('detect-rpi');
const app = express();
const port = 3001; 

app.use(cors());

let Gpio;
if (isPi()) {
  Gpio = require('onoff').Gpio;
} else {
  Gpio = require('./rpi-emulator/mock.js').Gpio;
}

const GPIO_PORTS = {};

app.get('/output/:id/:state', (req, res) => {
  if (!GPIO_PORTS[req.params.id]) {
    GPIO_PORTS[req.params.id] = new Gpio(req.params.id, 'out');
  }
  GPIO_PORTS[req.params.id].writesync(req.params.state);
  res.send();
});

app.listen(port, () => {
  console.log(`SAWC controller listening on port ${port} (${isPi() ? 'on' : 'off'} a Raspberry Pi)`);
})