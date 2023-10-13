const isPi = require('detect-rpi');
const devices = require('../devices').devices;

let GPIO
if (isPi()) {
  GPIO = require('onoff').Gpio;
} else {
  GPIO = require('../emulator/mock.js').Gpio;
}

const initOutput = (gpioNumber, direction) => {
  if (!devices.GPIO) {
    devices.GPIO = {};
  }
  devices.GPIO[gpioNumber] = new GPIO(gpioNumber, direction);
}

const setGpio = (gpioNumber, direction, state) => {
  if (!devices.GPIO) {
    console.log('initOutput');
    initOutput(gpioNumber, direction);
  } else if (devices.GPIO[gpioNumber]?.direction !== direction) {
    console.log('unexport')
    devices.GPIO[gpioNumber].unexport();
    initOutput(gpioNumber, direction);
  }
  console.log(direction, state)
  devices.GPIO[gpioNumber].writeSync(state);
}

module.exports = {
  setGpio,
}