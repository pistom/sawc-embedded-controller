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

const plantsMap = {
  1: 2,
  2: 3,
  3: 4,
  4: 14,
}

app.get('/output/:id/:state', (req, res) => {
  const gpioNumber = plantsMap[req.params.id];
  if (!GPIO_PORTS[gpioNumber]) {
    GPIO_PORTS[gpioNumber] = new Gpio(gpioNumber, 'out');
  }
  GPIO_PORTS[gpioNumber].writeSync(req.params.state === 'on' ? 1 : 0);
  res.json({success: true});
});

app.listen(port, () => {
  console.log(`SAWC controller listening on port ${port} (${isPi() ? 'on' : 'off'} a Raspberry Pi)`);
})