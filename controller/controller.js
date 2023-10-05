const { i2c, MODE_OUTPUT, OUTPUT_HIGH, OUTPUT_LOW } = require('@mrvanosh/mcp23x17');
const config = require('../config');
const { sleep } = require('./utils');
const isPi = require('detect-rpi');

const devices = {};


const initDevice = async (device) => {
  let MCP23x17;
  let bus;
  let mcp;
  if (isPi()) {
    const { MCP23x17 } = require('@mrvanosh/mcp23x17');
    bus = new i2c(1);
    mcp = new MCP23x17(bus, config.devices[device].address);
  } else {
    MCP23x17 = require('../rpi-emulator/mock.js').MCP23x17;
    bus = null;
    mcp = new MCP23x17(device);
  }
  await mcp.begin();

  devices[device] = devices[device] || {};
  devices[device].bus = bus;
  devices[device].mcp = mcp;
  devices[device].outputs = {};
}

const initOutput = async (device, output) => {
  if (!devices[device]) {
    await initDevice(device);
  }

  if (!devices[device].outputs[output]) {
    devices[device].outputs[output] = await devices[device]
      .mcp
      .mode(
        config.devices[device].outputs[output].pin,
        MODE_OUTPUT,
        OUTPUT_LOW
      );
  }
}

const startWater = async (device, output, duration) => {
  if (!devices[device]?.outputs[output]) {
    await initOutput(device, output);
  }
  devices[device].outputs[output].write(1);
  await sleep(duration);
  stopWater(device, output);
}

const stopWater = (device, output) => {
  devices[device].outputs[output].write(0);
}

module.exports = {
  startWater,
}