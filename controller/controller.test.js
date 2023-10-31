const { startWater, stopWater } = require('./controller');
const { Queue, Consumer } = require('./queues');

const ioMock = require('../__mocks__/ioMock');
const { configMock } = require('../__mocks__/configMock');

beforeAll(() => {
  jest.useFakeTimers();
  jest.mock('../config');
  require('../config').config = configMock;
});

afterAll(() => {
  jest.clearAllTimers();
  jest.resetAllMocks();
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