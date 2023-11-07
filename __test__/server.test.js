describe('server', () => {
  beforeAll(() => {
    jest.mock('detect-rpi');
    const isPi = require('detect-rpi');
    isPi.mockImplementation(() => false);
    jest.mock('../config');
    const { getConfig } = require('../config');
    getConfig.mockImplementation(() => { });
  });
  afterAll(() => {
    jest.unmock('detect-rpi');
    jest.unmock('../config');
  });
  beforeEach(async () => {
    jest.mock('fs');
    server = require('../server').initServer();
  });
  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.unmock('fs');
    jest.unmock('../controller/schedule.js')
  });

  test('server responds to /schedule', async () => {
    const fs = require('fs');
    fs.existsSync = jest.fn().mockImplementation(() => false);
    const { app } = require('../server');
    const request = require('supertest');
    const response = await request(app).get('/schedule');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ events: [] });
  });

  test('server responds to /schedule post method', async () => {
    const fs = require('fs');
    fs.existsSync = jest.fn().mockImplementation(() => false);
    jest.mock('../controller/schedule');
    const { saveScheduleEvent } = require('../controller/schedule');
    saveScheduleEvent.mockImplementation(() => ({"events": [] }));
    const { app } = require('../server');
    const request = require('supertest');
    const response = await request(app).post('/schedule');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ events: [] });
  });

  test('server responds to /schedule put method', async () => {
    const fs = require('fs');
    fs.existsSync = jest.fn().mockImplementation(() => false);
    jest.mock('../controller/schedule');
    const { saveScheduleEvent } = require('../controller/schedule');
    saveScheduleEvent.mockImplementation(() => ({"events": [] }));
    const { app } = require('../server');
    const request = require('supertest');
    const response = await request(app).put('/schedule');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ events: [] });
  });

  test('server responds to /schedule delete method', async () => {
    const fs = require('fs');
    fs.existsSync = jest.fn().mockImplementation(() => false);
    jest.mock('../controller/schedule');
    const { saveScheduleEvent } = require('../controller/schedule');
    saveScheduleEvent.mockImplementation(() => ({"events": [] }));
    const { app } = require('../server');
    const request = require('supertest');
    const response = await request(app).delete('/schedule/1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ events: [] });
  });

  test('server responds to /config', async () => {
    const fs = require('fs');
    fs.existsSync = jest.fn().mockImplementation(() => false);
    fs.readFileSync = jest.fn().mockImplementation(() => '{"devices": []}');
    jest.mock('../utils/filesUtils');
    const { getConfigFile } = require('../utils/filesUtils');
    getConfigFile.mockImplementation(() => ({}));
    const { app } = require('../server');
    const request = require('supertest');
    const response = await request(app).get('/config');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ "config": {"devices": []} });
  });

  test('set gpio number to on', async () => {
    jest.mock('../devices/gpio');
    const { setGpio } = require('../devices/gpio');
    setGpio.mockImplementation(() => { });
    const { app } = require('../server');
    const request = require('supertest');
    const response = await request(app).get('/gpio/1/on');
    expect(response.status).toBe(200);
    expect(setGpio).toHaveBeenCalledWith('1', 'out', 1);
    expect(response.body).toEqual({ "status": "success" });
  });

  test('set gpio number to off', async () => {
    jest.mock('../devices/gpio');
    const { setGpio } = require('../devices/gpio');
    setGpio.mockImplementation(() => { });
    const { app } = require('../server');
    const request = require('supertest');
    const response = await request(app).get('/gpio/1/off');
    expect(response.status).toBe(200);
    expect(setGpio).toHaveBeenCalledWith('1', 'out', 0);
    expect(response.body).toEqual({ "status": "success" });
  });
});

describe('socket', () => {
  const io = require('socket.io-client');
  const { initServer, startServer } = require('../server');
  const ioServer = require('../server').io;
  let server;
  let ioClient;

  beforeAll(async () => {
    server = await initServer();
    await startServer(server);
  });
  afterAll((done) => {
    ioServer.close();
    done();
  });
  beforeEach((done) => {
    ioClient = io('http://localhost:3301', {
      reconnection: true,
      forceNew: true,
      transports: ['websocket']
    });

    jest.mock('../controller/controller');
    ioClient.on('connect', () => {
      done();
    });
  });
  afterEach(done => {
    if (ioClient.connected) {
      ioClient.disconnect();
    }
    ioClient.close();
    done();
  });


  it('startWater', (done) => {
    ioClient.emit('message', { action: 'startWater', device: '1', output: '1' }, (arg) => {
      expect(require('../controller/controller').startWater).toHaveBeenCalledWith({}, { action: 'startWater', device: '1', output: '1' }, expect.anything());
      done();
    });

  });
  it('stopWater', (done) => {
    ioClient.emit('message', { action: 'stopWater', device: '1', output: '1' }, (arg) => {
      expect(require('../controller/controller').stopWater).toHaveBeenCalledWith({}, { action: 'stopWater', device: '1', output: '1' }, expect.anything());
      done();
    });
  });
  it('getRemainingTimes', (done) => {
    const message = { action: 'getRemainingTimes', device: '1' };
    ioClient.emit('message', message, (arg) => {
      expect(require('../controller/controller').getRemainingTimes).toHaveBeenCalledWith({}, message.device, expect.anything());
      done();
    });
  });
  it('editOutput', (done) => {
    const message = { action: 'editOutput', device: '1', output: '1', name: 'test' };
    ioClient.emit('message', message, (arg) => {
      expect(require('../controller/controller').editOutput).toHaveBeenCalledWith(message, expect.anything());
      done();
    });
  });
  it('editDevice', (done) => {
    const message = { action: 'editDevice', device: '1', name: 'test' };
    ioClient.emit('message', message, (arg) => {
      expect(require('../controller/controller').editDevice).toHaveBeenCalledWith(message, expect.anything());
      done();
    });
  });
  it('editDeviceOutput', (done) => {
    const message = { action: 'editDeviceOutput', device: '1', output: '1', name: 'test' };
    ioClient.emit('message', message, (arg) => {
      expect(require('../controller/controller').editDeviceOutput).toHaveBeenCalledWith(message, expect.anything());
      done();
    });
  });
  it('calibrate', (done) => {
    const message = { action: 'calibrate', device: '1', output: '1' };
    ioClient.emit('message', message, (arg) => {
      expect(require('../controller/controller').calibrate).toHaveBeenCalledWith({}, message, expect.anything());
      done();
    });
  });
  it('stopCalibrating', (done) => {
    const message = { action: 'stopCalibrating', device: '1', output: '1' };
    ioClient.emit('message', message, (arg) => {
      expect(require('../controller/controller').stopCalibrating).toHaveBeenCalledWith(message, expect.anything());
      done();
    });
  });
  it('calculateRatio', (done) => {
    const message = { action: 'calculateRatio', device: '1', output: '1' };
    ioClient.emit('message', message, (arg) => {
      expect(require('../controller/controller').calculateRatio).toHaveBeenCalledWith(message, expect.anything());
      done();
    });
  });
  

});