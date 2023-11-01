const { i2c, MODE_OUTPUT, OUTPUT_LOW, OUTPUT_HIGH } = require('@mrvanosh/mcp23x17');
const { config } = require('../config');
const isPi = require('detect-rpi');


/**
 * 
 * @param {string} device 
 */
const initDevice = async (device) => {
  const devices = require('../devices').devices;
  let MCP23x17;
  let bus;
  let mcp;
  if (isPi()) {
    const { MCP23x17 } = require('@mrvanosh/mcp23x17');
    bus = new i2c(1);
    mcp = new MCP23x17(bus, config.devices[device].address);
  } else {
    MCP23x17 = require('../emulator/mock.js').MCP23x17;
    bus = null;
    mcp = new MCP23x17(device);
  }
  await mcp.begin();

  devices[device] = devices[device] || {};
  devices[device].bus = bus;
  devices[device].mcp = mcp;
  devices[device].outputs = {};
}

/**
 * 
 * @param {string} device 
 * @param {string} output 
 */
const initOutput = async (device, output) => {
  const devices = require('../devices').devices;
  if (!devices[device]) {
    await initDevice(device);
  }
  const pin = require('../config').config.devices[device].outputs[output].pin
  if (!devices[device].outputs[output]) {
    devices[device].outputs[output] = await devices[device]
      .mcp
      .mode(
        pin,
        MODE_OUTPUT,
        OUTPUT_HIGH
      );
  }
}

const initInput = async (device) => {
  const devices = require('../devices').devices;
  if (!devices[device]) {
    await initDevice(device);
  }

  if (!devices[device].inputs) {
    devices[device].inputs = {};
    for (const input in config.devices[device].inputs) {
      devices[device].inputs[input] = await devices[device]
        .mcp
        .mode(
          config.devices[device].inputs[input].pin,
          MODE_INPUT
        );
    }
  }
}



module.exports = {
  initDevice,
  initOutput,
  initInput,
}