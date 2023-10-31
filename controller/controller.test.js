const { startWater, stopWater, calibrate, stopCalibrating } = require('./controller');
const { Queue, Consumer } = require('./queues');
const { startPump, stopPump } = require('./pump');
jest.mock('./pump');
const { outputOn, outputOff } = require('./inputOutput');
jest.mock('./inputOutput');
const ioMock = require('../__mocks__/ioMock');
const { configMock } = require('../__mocks__/configMock');
const { sleep } = require('../utils/sleep');

beforeAll(() => {
  jest.resetAllMocks();
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.mock('../config');
  require('../config').config = configMock;
});

afterEach(async () => {
  jest.clearAllTimers();
  await jest.runAllTimers();
});

describe('startWater', () => {
  test('adds output to queue and starts consumer if not running', async () => {
    const queues = {};
    const message = { device: 'MODULE_01', output: '1', volume: 10 };
    await startWater(queues, message, ioMock);
    expect(queues['MODULE_01']).toBeInstanceOf(Queue);
    expect(queues['MODULE_01'].queue[0].duration).toBe(20);
    expect(queues['MODULE_01'].consumer).toBeInstanceOf(Consumer);
  });

  it('prevents watering if calibration is not done', async () => {
    const calibratingModule = require('./calibrating');
    calibratingModule.isCalibrating = true;
    const queues = {};
    const message = { device: 'MODULE_01', output: '1', volume: 10 };
    await startWater(queues, message, ioMock);
    expect(ioMock.emit).toHaveBeenCalledWith('message', { status: 'calibratingError', device: 'MODULE_01', output: '1', message: 'Cannot start water while calibrating' });
    jest.resetModules();
  });
});

describe('stopWater', () => {
  test('stops output if running', async () => {
    const queues = {};
    const message1 = { device: 'MODULE_01', output: '1', volume: 10 };
    const message2 = { device: 'MODULE_01', output: '2', volume: 10 };
    await startWater(queues, message1, ioMock);
    await startWater(queues, message2, ioMock);
    await stopWater(queues, message1, ioMock);
    expect(queues['MODULE_01'].queue.length).toBe(1);
  });
});

describe('calibrate', () => {
  it('should run pump and output for calibrateDuration time when calibrating', async () => {
    const queues = {};
    const calibrateMessage = { device: 'MODULE_01', output: '1' };
    const ioMock = require('../__mocks__/ioMock');
    calibrate(queues, calibrateMessage, ioMock);
    expect(startPump).toHaveBeenCalledWith('MODULE_01');
    expect(outputOn).toHaveBeenCalledWith('MODULE_01', '1');
    await jest.runAllTimers();
    await jest.runAllTimers();
    expect(ioMock.emit).toHaveBeenCalledWith('message', { status: 'calibratingWaterStarted', duration: 10, device: 'MODULE_01', output: '1' });
    await jest.useFakeTimers();
    expect(stopPump).toHaveBeenCalledWith('MODULE_01');
  });

  it('should stop calibrating if calibrateDuration is aborted', async () => {
    const calibrateMessage = { device: 'MODULE_01', output: '1' };
    const calibratingModule = require('./calibrating');
    calibratingModule.isCalibrating = true;
    calibratingModule.calibrateSleep = sleep(2);
    await stopCalibrating(calibrateMessage, ioMock);
    expect(ioMock.emit).toHaveBeenCalledWith('message', { status: 'calibratingWaterAborted', device: 'MODULE_01', output: '1' });
    expect(stopPump).toHaveBeenCalledWith('MODULE_01');
    expect(outputOff).toHaveBeenCalledWith('MODULE_01', '1');
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
    expect(queues['MODULE_01'].queue.length).toBe(2);
    await jest.runAllTimers();
    expect(queues['MODULE_01'].queue.length).toBe(1);
    await jest.runAllTimers();
    expect(queues['MODULE_01']).toBeUndefined();
    await jest.runAllTimers();
  });
});