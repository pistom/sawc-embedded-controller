import isPi from 'detect-rpi';
import { devices } from '../devices/index.js';

let GPIO
if (isPi()) {
  GPIO = import('onoff').Gpio;
} else {
  GPIO = import('../emulator/mock.js').Gpio;
}

const initOutput = (gpioNumber, direction) => {
  if (!devices.GPIO) {
    devices.GPIO = {};
  }
  devices.GPIO[gpioNumber] = new GPIO(gpioNumber, direction);
}

const setGpio = (gpioNumber, direction, state) => {
  if (!devices.GPIO || !devices.GPIO[gpioNumber]) {
    initOutput(gpioNumber, direction);
  } else if (devices.GPIO[gpioNumber]?.direction !== direction) {
    devices.GPIO[gpioNumber].unexport();
    initOutput(gpioNumber, direction);
  }
  devices.GPIO[gpioNumber].writeSync(state);
}

export {
  setGpio,
}