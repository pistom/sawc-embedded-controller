const { i2c, MODE_OUTPUT, OUTPUT_LOW } = require('@mrvanosh/mcp23x17');
const config = require('../config');
const isPi = require('detect-rpi');

const devices = require('../devices').devices;

/**
 * 
 * @param {string} device 
 */
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

/**
 * 
 * @param {string} device 
 * @param {string} output 
 */
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

module.exports = {
	initDevice,
	initOutput,
}