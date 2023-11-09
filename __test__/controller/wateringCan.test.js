const { startWater, stopWater, calibrate, stopCalibrating, editOutput, editDevice, editDeviceOutput, calculateRatio, getRemainingTimes } = require('../../controller/wateringCan');
const { Queue } = require('../../queue/queue');
const { Consumer } = require('../../queue/consumer');
const { startPump, stopPump } = require('../../controller/pump');
jest.mock('../../controller/pump');
const { outputOn, outputOff } = require('../../controller/inputOutput');
jest.mock('../../controller/inputOutput');
let ioMock;
let queues = {};
const { configMock } = require('../../__mocks__/configMock');
const { sleep } = require('../../utils/sleep');
const calibrating = require('../../controller/calibrating');

afterAll(() => {
  jest.resetAllMocks();
});

beforeEach(async() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.mock('../../config');
  require('../../config').config = configMock;
  ioMock = require('../../__mocks__/ioMock');
});

describe('startWater', () => {
  test('adds output to queue and starts consumer if not running', async () => {
    queues = {};
    const message = { device: 'MODULE_01', output: '1', volume: 10 };
    await startWater(queues, message, ioMock);
    expect(queues['MODULE_01']).toBeInstanceOf(Queue);
    expect(queues['MODULE_01'].queue[0].duration).toBe(20);
    expect(queues['MODULE_01'].consumer).toBeInstanceOf(Consumer);
  });

  it('prevents watering if calibration is not done', async () => {
    const calibratingModule = require('../../controller/calibrating');
    calibratingModule.isCalibrating = true;
    queues = {};
    const message = { device: 'MODULE_01', output: '1', volume: 10 };
    await startWater(queues, message, ioMock);
    expect(ioMock.emit).toHaveBeenCalledWith('message', { status: 'calibratingError', device: 'MODULE_01', output: '1', message: 'Cannot start water while calibrating' });
    jest.resetModules();
  });
});

describe('stopWater', () => {
  test('stops output if running', async () => {
    queues = {};
    const message1 = { device: 'MODULE_01', output: '1', volume: 10 };
    const message2 = { device: 'MODULE_01', output: '2', volume: 10 };
    await startWater(queues, message1, ioMock);
    await startWater(queues, message2, ioMock);
    await stopWater(queues, message1, ioMock);
    expect(queues['MODULE_01'].queue.length).toBe(1);
  });

  test('aborts output if not running', async () => {
    queues = {};
    const message = { device: 'MODULE_01', output: '1' };
    await stopWater(queues, message, ioMock);
    await jest.runAllTimers();
    expect(ioMock.emit).toHaveBeenCalledWith('message', {device: 'MODULE_01', output: '1', status: 'error', message: 'No queue for device' });
  });
});

describe('calibrate', () => {
  it('should run pump and output for calibrateDuration time when calibrating', async () => {
    queues = {};
    const calibrateMessage = { device: 'MODULE_01', output: '1' };
    ioMock = require('../../__mocks__/ioMock');
    calibrate(queues, calibrateMessage, ioMock);
    await jest.runAllTimers();
    expect(startPump).toHaveBeenCalledWith('MODULE_01');
    expect(outputOn).toHaveBeenCalledWith('MODULE_01', '1');
    await jest.runAllTimers();
    expect(ioMock.emit).toHaveBeenCalledWith('message', { status: 'calibratingWaterStarted', duration: 10, device: 'MODULE_01', output: '1' });
    await jest.runAllTimers();
    expect(stopPump).toHaveBeenCalledWith('MODULE_01');
  });

  it('should stop calibrating if calibrateDuration is aborted', async () => {
    ioMock = require('../../__mocks__/ioMock');
    const calibrateMessage = { device: 'MODULE_01', output: '1' };

    jest.mock('../../controller/calibrating');
    require('../../controller/calibrating').isCalibrating = false;
    require('../../controller/calibrating').calibrateSleep = null;

    const calibratingModule = require('../../controller/calibrating');
    console.dir(calibratingModule);
    calibrate({}, calibrateMessage, ioMock);
    await stopCalibrating(calibrateMessage, ioMock);
    await jest.runAllTimers();
    await jest.runAllTimers();
    await jest.runAllTimers();
    await jest.runAllTimers();
    await jest.runAllTimers();
    expect(calibratingModule.isCalibrating).toBe(false);
    expect(ioMock.emit).toHaveBeenLastCalledWith("message", {"device": "MODULE_01", "duration": 10, "output": "1", "status": "calibratingWaterAborted"});
    // expect(ioMock.emit).toHaveBeenCalledTimes(2);
    expect(stopPump).toHaveBeenCalledWith('MODULE_01');
    expect(outputOff).toHaveBeenCalledWith('MODULE_01', '1');
  });

  it('should not calibrate if already calibrating', async () => {
    ioMock = require('../../__mocks__/ioMock');
    const calibrateMessage = { device: 'MODULE_01', output: '1' };
    const calibratingModule = require('../../controller/calibrating');
    calibratingModule.isCalibrating = true;
    await calibrate(queues, calibrateMessage, ioMock);
    expect(ioMock.emit).toHaveBeenCalledWith('message', { status: 'calibratingError', device: 'MODULE_01', output: '1', message: 'Already calibrating' });
    jest.resetModules();
  });

  it('should not calibrate if queue is running', async () => {
    ioMock = require('../../__mocks__/ioMock');
    const calibrateMessage = { device: 'MODULE_01', output: '1' };
    queues = {};
    await startWater(queues, calibrateMessage, ioMock);
    await calibrate(queues, calibrateMessage, ioMock);
    expect(ioMock.emit).toHaveBeenCalledWith('message', { status: 'calibratingError', device: 'MODULE_01', output: '1', message: 'Cannot calibrate while queue is running' });
    jest.resetModules();
  });
});

describe('getRemainingTimes', () => {
  test('gets remaining times', async () => {
    queues = {};
    const message1 = { device: 'MODULE_01', output: '1', volume: 10 };
    const message2 = { device: 'MODULE_01', output: '2', volume: 10 };
    await startWater(queues, message1, ioMock);
    await startWater(queues, message2, ioMock);
    const fileUtils = require('../../utils/filesUtils');
    fileUtils.getConfigFile = jest.fn().mockImplementation(() => {
      return configMock;
    });
    jest.useFakeTimers();
    const remainingTimes = getRemainingTimes(queues, 'MODULE_01', ioMock);
    expect(ioMock.emit).toHaveBeenCalled();
    expect(remainingTimes['1']["wateringIn"]).toBeLessThanOrEqual(0);
    expect(remainingTimes['2']["wateringIn"]).toBeLessThanOrEqual(20);
    expect(remainingTimes['2']["wateringIn"]).toBeGreaterThan(10);
  });
});

describe('Consumer', () => {
  test('consumes queue', async () => {
    const queues = {};
    const message1 = { device: 'MODULE_01', output: '1', volume: 5 };
    const message2 = { device: 'MODULE_01', output: '2', volume: 5 };
    const message3 = { device: 'MODULE_01', output: '3', volume: 5 };
    await startWater(queues, message1, ioMock);
    await startWater(queues, message2, ioMock);
    await startWater(queues, message3, ioMock);
    expect(queues['MODULE_01'].queue.length).toBe(3);
    expect(queues['MODULE_01'].consumer).toBeInstanceOf(Consumer);
    expect(queues['MODULE_01'].queue[0].status).toBe('running');
    await jest.runAllTimers();
    await jest.runAllTimers();
    expect(queues['MODULE_01'].queue.length).toBe(2);
    await jest.runAllTimers();
    await jest.runAllTimers();
    await jest.runAllTimers();
    expect(queues['MODULE_01'].queue.length).toBe(1);
    await jest.runAllTimers();
    await jest.runAllTimers();
    await jest.runAllTimers();
    expect(queues['MODULE_01']).toBeUndefined();
    await jest.runAllTimers();
  });
});

describe('editOutput', () => {
  test('edits output', async () => {
    const message = { device: 'MODULE_01', output: '1', name: 'Test name', image: 'testimage.jpg', defaultVolume: 221, ratio: .5 };
    const fileUtils = require('../../utils/filesUtils');
    fileUtils.getConfigFile = jest.fn().mockImplementation(() => {
      return configMock;
    });
    fileUtils.saveConfigFile = jest.fn();
    editOutput(message, ioMock);
    expect(fileUtils.getConfigFile).toHaveBeenCalled();
    expect(configMock.devices['MODULE_01'].outputs['1'].name).toBe('Test name');
    expect(configMock.devices['MODULE_01'].outputs['1'].image).toBe('testimage.jpg');
    expect(configMock.devices['MODULE_01'].outputs['1'].defaultVolume).toBe(221);
    expect(configMock.devices['MODULE_01'].outputs['1'].ratio).toBe(.5);
    expect(fileUtils.saveConfigFile).toHaveBeenCalled();
  });
});

describe('editDevice', () => {
  test('edits device', async () => {
    const message = { device: 'MODULE_01', name: 'Test name', defaultVolume: 221, defaultRatio: .5, maxVolumePerOutput: 100, calibrateDuration: 10 };
    const fileUtils = require('../../utils/filesUtils');
    fileUtils.getConfigFile = jest.fn().mockImplementation(() => {
      return configMock;
    });
    fileUtils.saveConfigFile = jest.fn();
    editDevice(message, ioMock);
    expect(fileUtils.getConfigFile).toHaveBeenCalled();
    expect(configMock.devices['MODULE_01'].name).toBe('Test name');
    expect(configMock.devices['MODULE_01'].settings.defaultVolume).toBe(221);
    expect(configMock.devices['MODULE_01'].settings.defaultRatio).toBe(.5);
    expect(configMock.devices['MODULE_01'].settings.maxVolumePerOutput).toBe(100);
    expect(configMock.devices['MODULE_01'].settings.calibrateDuration).toBe(10);
    expect(fileUtils.saveConfigFile).toHaveBeenCalled();
  });

  test('edits device outputs', async () => {
    const message = { device: 'MODULE_01', output: '1', pin: 1, disabled: true };
    const fileUtils = require('../../utils/filesUtils');
    fileUtils.getConfigFile = jest.fn().mockImplementation(() => {
      return configMock;
    });
    fileUtils.saveConfigFile = jest.fn();
    editDeviceOutput(message, ioMock);
    expect(fileUtils.getConfigFile).toHaveBeenCalled();
    expect(configMock.devices['MODULE_01'].outputs['1'].pin).toBe(1);
    expect(configMock.devices['MODULE_01'].outputs['1'].disabled).toBe(true);
    expect(fileUtils.saveConfigFile).toHaveBeenCalled();
  });
});

describe('calculateRatio', () => {
  test('calculates ratio', async () => {
    const message = { device: 'MODULE_01', output: '1', volume: 5 };
    const fileUtils = require('../../utils/filesUtils');
    fileUtils.getConfigFile = jest.fn().mockImplementation(() => {
      return configMock;
    });
    const ratio = calculateRatio(message, ioMock);
    expect(ioMock.emit).toHaveBeenCalledWith('message', { status: 'ratioCalculated', device: 'MODULE_01', output: '1', ratio: .5 });
    expect(ratio).toBe(.5);
  });
});