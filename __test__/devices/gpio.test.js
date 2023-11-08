
describe('gpio', () => {
  let Gpio;
  let devices;

  beforeAll(() => {
    jest.mock('../../devices');
    devices = require('../../devices').devices;
    devices.devices = {};
    jest.mock('detect-rpi');
    const isPi = require('detect-rpi');
    isPi.mockImplementation(() => true);
    jest.mock('onoff');
    Gpio = require('onoff').Gpio;
    Gpio.mockImplementation((gpioNumber, direction) => {
      return {
        direction,
        writeSync: jest.fn(),
        unexport: jest.fn(),
      };
    });
  });

  test('set gpio number to on', async () => {
    require('../../devices/gpio').setGpio('1', 'out', 1);
    expect(devices.GPIO['1']).toBeDefined();
    expect(devices.GPIO['1'].direction).toBe('out');
    expect(devices.GPIO['1'].writeSync).toHaveBeenCalledWith(1);
  });
  test('set gpio number to off', async () => {
    require('../../devices/gpio').setGpio('2', 'out', 0);
    expect(devices.GPIO['2']).toBeDefined();
    expect(devices.GPIO['2'].direction).toBe('out');
    expect(devices.GPIO['2'].writeSync).toHaveBeenCalledWith(0);
  });
  test('gpio number change direction', async () => {
    require('../../devices/gpio').setGpio('1', 'in', 1);
    expect(devices.GPIO['1']).toBeDefined();
    expect(devices.GPIO['1'].direction).toBe('in');
  });

});