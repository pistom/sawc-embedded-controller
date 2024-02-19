const { i2c, MODE_OUTPUT, OUTPUT_LOW, OUTPUT_HIGH } = import('@mrvanosh/mcp23x17');
import { config } from '../config.js';
import isPi from 'detect-rpi';
import { devices } from '../devices/index.js';


/**
 * 
 * @param {string} device 
 */
const initDevice = async (device) => {
  let MCP23x17;
  let bus;
  let mcp;
  if (isPi()) {
    const { MCP23x17 } = import('@mrvanosh/mcp23x17');
    bus = new i2c(1);
    mcp = new MCP23x17(bus, config.devices[device].address);
  } else {
    const mock = import('../emulator/mock.js');
    MCP23x17 = (await mock).MCP23x17;
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
  if (!devices[device]) {
    await initDevice(device);
  }
  const pin = config.devices[device].outputs[output].pin
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



export {
  initDevice,
  initOutput,
  initInput,
}