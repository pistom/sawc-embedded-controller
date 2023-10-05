const { i2c, MCP23x17, A0, MODE_OUTPUT, OUTPUT_HIGH, A7, A2, OUTPUT_LOW } = require('@mrvanosh/mcp23x17');
const config = require('../config');
const { sleep } = require('./utils');

const devices = {};

const initDevice = async (device) => {
  const bus = new i2c(1);
  const mcp = new MCP23x17(bus, 0x27);

  await mcp.begin();

  devices[device] = devices[device] || {};
  devices[device].bus = bus;
  devices[device].mcp = mcp;
}

const water = async (device, output, duration) => {
  console.dir(config.devices[device].outputs[output]);
  if (!devices[device]) {
    await initDevice(device);
  }

  for (let i = 0; i <= 15; i++) {
    let output = await devices[device].mcp.mode(i, MODE_OUTPUT, OUTPUT_HIGH);
    output.write(1)
    await sleep(50);
    output.write(0)
  }
}

const stopWater = (device, output) => {
  console.dir(config.devices[device].outputs[output]);
}

module.exports = {
	water,
}