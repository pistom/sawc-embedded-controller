const { startWater, stopWater } = require('./controller');
const { Queue, Consumer } = require('./queues');


describe('startWater', () => {
  test('adds output to queue and starts consumer if not running', async () => {
    jest.useFakeTimers();
    const queues = {};
    const message = { device: 'MODULE_01', output: '1', duration: 10 };
    const io = null;
    await startWater(queues, message, io);
    expect(queues['MODULE_01']).toBeInstanceOf(Queue);
    expect(queues['MODULE_01'].consumer).toBeInstanceOf(Consumer);
  });
});

describe('stopWater', () => {
  test('stops output if running', async () => {
    const queues = {};
    const message1 = { device: 'MODULE_01', output: '1', duration: 10 };
    const message2 = { device: 'MODULE_01', output: '2', duration: 10 };
    const io = {
      emit: jest.fn()
    };
    await startWater(queues, message1, io);
    await startWater(queues, message2, io);
    await stopWater(queues, message1, io);
    expect(queues['MODULE_01'].queue.length).toBe(1);
  });
});

describe('Consumer', () => {
  test.only('consumes queue', async () => {
    await jest.useFakeTimers();
    const queues = {};
    const message1 = { device: 'MODULE_01', output: '1', duration: 1 };
    const message2 = { device: 'MODULE_01', output: '2', duration: 1 };
    const message3 = { device: 'MODULE_01', output: '3', duration: 1 };
    const io = {
      emit: jest.fn((msg, data) => console.log(data))
    };
    await startWater(queues, message1, io);
    await startWater(queues, message2, io);
    await startWater(queues, message3, io);
    expect(queues['MODULE_01'].queue.length).toBe(3);
    expect(queues['MODULE_01'].consumer).toBeInstanceOf(Consumer);
    expect(queues['MODULE_01'].queue[0].status).toBe('running');
    await jest.runAllTimers();
    expect(queues['MODULE_01'].queue.length).toBe(2);
    await jest.runAllTimers();
    expect(queues['MODULE_01'].queue.length).toBe(1);
    await jest.runAllTimers();
    expect(queues['MODULE_01']).toBeUndefined();
  });
});