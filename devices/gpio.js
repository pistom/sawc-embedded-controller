const isPi = require('detect-rpi');

let GPIO
if (isPi()) {
  GPIO = require('onoff').Gpio;
} else {
  GPIO = require('../emulator/mock.js').Gpio;
}

const initOutput = (gpioNumber, direction) => {
  const devices = require('../devices').devices;
  if (!devices.GPIO) {
    devices.GPIO = {};
  }
  devices.GPIO[gpioNumber] = new GPIO(gpioNumber, direction);
}

const setGpio = (gpioNumber, direction, state) => {
  const devices = require('../devices').devices;
  if (!devices.GPIO || !devices.GPIO[gpioNumber]) {
    initOutput(gpioNumber, direction);
  } else if (devices.GPIO[gpioNumber]?.direction !== direction) {
    devices.GPIO[gpioNumber].unexport();
    initOutput(gpioNumber, direction);
  }
  devices.GPIO[gpioNumber].writeSync(state);
}

module.exports = {
  setGpio,
}