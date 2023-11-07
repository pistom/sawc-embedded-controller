const { devicesMock } = require('../../__mocks__/devicesMock');
const { configMock } = require('../../__mocks__/configMock');
const { startPump, stopPump } = require('../../controller/pump');

beforeEach(async() => {
  jest.mock('../../emulator/mock');
  require('../../emulator/mock').MCP23x17 = jest.fn().mockImplementation(() => {
    return {
      begin: function () {
        return new Promise((resolve, reject) => {
          resolve();
        });
      },
      mode: function (pin, mode, value) {
        return new Promise((resolve, reject) => {
          resolve({
            write: jest.fn()
          });
        });
      }
    }
  }
  );
});
describe('pump', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.mock('../../devices');
    require('../../devices').devices = devicesMock;
    jest.mock('../../config');
    require('../../config').config = configMock;
    delete devicesMock['MODULE_01'];
  });

  it('should start pump', async () => {
    jest.useFakeTimers();
    const delay = 200;
    configMock.devices['MODULE_01'].outputs['pump'].delayOn = delay;
    await startPump('MODULE_01');
    expect(devicesMock['MODULE_01'].outputs['pump'].write).not.toHaveBeenCalled();
    await jest.advanceTimersByTime(delay);
    expect(devicesMock['MODULE_01'].outputs['pump'].write).toHaveBeenCalledWith(0);
  });

  it('should stop pump', async () => {
    await startPump('MODULE_01');
    await stopPump('MODULE_01');
    expect(devicesMock['MODULE_01'].outputs['pump'].write).toHaveBeenCalledWith(1);
  });

  it('should not start pump if disabled', async () => {
    configMock.devices['MODULE_01'].outputs['pump'].disabled = true;
    await startPump('MODULE_01');
    expect(devicesMock['MODULE_01']).toBeUndefined();
  });

  it('should not stop pump if disabled', async () => {
    configMock.devices['MODULE_01'].outputs['pump'].disabled = true;
    await startPump('MODULE_01');
    await stopPump('MODULE_01');
    expect(devicesMock['MODULE_01']).toBeUndefined();
  });
});