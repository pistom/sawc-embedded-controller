const express = require('express');
const cors = require('cors');
const isPi = require('detect-rpi');
const app = express();
const port = 3001;
app.use(cors());

let GPIO
let MCP23017;
let mcp;
if (isPi()) {
  GPIO = require('onoff').Gpio;
  MCP23017 = require('node-mcp23017');
  const mcp = new MCP23017({
    address: 0x20,
    device: 1,
    debug: true,
  });
} else {
  GPIO = require('./rpi-emulator/mock.js').Gpio;
}

const GPIO_PORTS = {};
const MCP23017_PORTS = {};

const plantsMap = {
  1: 2,
  2: 3,
  3: 4,
  4: 14,
}

app.get('/output/:id/:state', (req, res) => {
  const gpioNumber = plantsMap[req.params.id];
  if (!GPIO_PORTS[gpioNumber]) {
    GPIO_PORTS[gpioNumber] = new GPIO(gpioNumber, 'out');
  }
  GPIO_PORTS[gpioNumber].writeSync(req.params.state === 'on' ? 1 : 0);
  res.json({ success: true });
});

app.get('/test', (req, res) => {
  for (var i = 0; i < 16; i++) {
    mcp.pinMode(i, mcp.OUTPUT);
  }
  mcp.digitalWrite(0, mcp.HIGH);
  mcp.digitalWrite(1, mcp.HIGH);

  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`SAWC controller listening on port ${port} (${isPi() ? 'on' : 'off'} a Raspberry Pi)`);
})