const express = require('express');
const cors = require('cors');
const isPi = require('detect-rpi');
const app = express();
const port = 3001;
app.use(cors());

const MCP23017 = require('node-mcp23017');
const { water } = require('./controller/controller.js');

let GPIO
if (isPi()) {
  GPIO = require('onoff').Gpio;
} else {
  GPIO = require('./rpi-emulator/mock.js').Gpio;
}

const GPIO_PORTS = {};
const MCP23017_PORTS = {};


app.get('/output/:id/:state', (req, res) => {
  water("MODULE_01", 1, 1000);
  res.json({ success: true });
});


app.get('/test', (req, res) => {
  const gpioNumber = plantsMap[req.params.id];
  if (!GPIO_PORTS[gpioNumber]) {
    GPIO_PORTS[gpioNumber] = new GPIO(gpioNumber, 'out');
  }
  GPIO_PORTS[gpioNumber].writeSync(req.params.state === 'on' ? 1 : 0);
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`SAWC controller listening on port ${port} (${isPi() ? 'on' : 'off'} a Raspberry Pi)`);
})
