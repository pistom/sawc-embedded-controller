const { devicesMock } = require('../../__mocks__/devicesMock');
const { configMock } = require('../../__mocks__/configMock');
const { outputOn, outputOff } = require('../../controller/inputOutput');

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

describe('inputOutput', () => {
  beforeEach(async() => {
    jest.clearAllMocks();
    jest.mock('../../devices');
    require('../../devices').devices = devicesMock;
    jest.mock('../../config');
    require('../../config').config = configMock;
    delete devicesMock['MODULE_01'];
  });

  it('should turn on output', async () => {
    await outputOn('MODULE_01', '1');
    expect(devicesMock['MODULE_01'].outputs['1'].write).toHaveBeenCalledWith(0);
  });

  it('should turn off output', async () => {
    await outputOff('MODULE_01', '1');
    expect(devicesMock['MODULE_01'].outputs['1'].write).toHaveBeenCalledWith(1);
  });
});