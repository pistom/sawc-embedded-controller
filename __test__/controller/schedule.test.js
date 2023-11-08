const scheduleMock = require("../../__mocks__/scheduleMock.js");
const { saveScheduleEvent } = require("../../controller/schedule");

describe('schedule', () => {
  beforeEach(() => {
    jest.mock('fs');
    jest.mock('../../config');
    jest.mock('../../controller/schedule');
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.unmock('fs');
    jest.unmock('../../config');
    jest.unmock('../../controller/schedule');
    jest.unmock('../../utils/filesUtils.js');
  });

  it('add new schedule event of type always', async () => {
    const eventData = {
      id: -1,
      type: 'always',
      output: 1,
      device: 'MODULE_01',
      startDate: '2020-01-01',
      days: ['Monday', 'Tuesday'],
      watering: [{time: '12:00', volume: 100}],
    }
    const event = saveScheduleEvent(eventData, 'add');
    expect(event).toEqual({
      id: 1,
      type: 'always',
      output: 1,
      startDate: '2020-01-01',
      device: 'MODULE_01',
      days: ['Monday', 'Tuesday'],
      watering: [{time: '12:00', volume: 100}],
    });
  });

  it('add new schedule event of type period', async () => {
    jest.mock('../../utils/filesUtils.js');
    const scheduleMock = require('../../__mocks__/scheduleMock.js');
    const { getScheduleFile } = require('../../utils/filesUtils.js');
    getScheduleFile.mockImplementation(() => scheduleMock);
    const eventData = {
      id: -1,
      type: 'period',
      output: 1,
      device: 'MODULE_01',
      // days: ['Monday', 'Tuesday'],
      watering: [{time: '2000-01-01T12:00', volume: 100}],
      repeatEvery: 2,
      startDate: '2020-01-01',
      endDate: '2020-01-31',
    }
    const event = saveScheduleEvent(eventData, 'add');
    expect(event).toEqual({
      id: 5,
      type: 'period',
      output: 1,
      device: 'MODULE_01',
      // days: ['Monday', 'Tuesday'],
      repeatEvery: 2,
      watering: [{time: '12:00', volume: 100}],
      startDate: '2020-01-01',
      endDate: '2020-01-31',
    });
  });

  it('add new schedule event of type once', async () => {
    jest.mock('../../utils/filesUtils.js');
    const scheduleMock = require('../../__mocks__/scheduleMock.js');
    const { getScheduleFile } = require('../../utils/filesUtils.js');
    getScheduleFile.mockImplementation(() => scheduleMock);
    const eventData = {
      id: -1,
      type: 'once',
      output: 1,
      device: 'MODULE_01',
      watering: [{time: 'wrong-time', volume: 100}],
      startDate: '2020-01-01',
    }
    const event = saveScheduleEvent(eventData, 'add');
    expect(event).toEqual({
      id: 5,
      type: 'once',
      output: 1,
      device: 'MODULE_01',
      watering: [{time: '00:00', volume: 100}],
      startDate: '2020-01-01',
    });
  });

  it('edit schedule event', async () => {
    jest.mock('../../utils/filesUtils.js');
    const scheduleMock = require('../../__mocks__/scheduleMock.js');
    const { getScheduleFile, saveScheduleFile } = require('../../utils/filesUtils.js');
    getScheduleFile.mockImplementation(() => scheduleMock);
    saveScheduleFile.mockImplementation(() => scheduleMock);
    const eventData = {
      id: 1,
      type: 'always',
      output: 1,
      device: 'MODULE_01',
      startDate: '2020-01-01',
      repeatEvery: 2,
      watering: [{time: '12:00', volume: 100}],
    }
    const event = saveScheduleEvent(eventData, 'edit');
    expect(event).toEqual({
      id: 1,
      type: 'always',
      output: 1,
      device: 'MODULE_01',
      repeatEvery: 2,
      startDate: '2020-01-01',
      watering: [{time: '12:00', volume: 100}],
    });
    expect(scheduleMock.events[0].repeatEvery).toEqual(2);
    expect(scheduleMock.events[0].days).toBeUndefined();
  });

  it('delete schedule event', async () => {
    jest.mock('../../utils/filesUtils.js');
    const scheduleMock = require('../../__mocks__/scheduleMock.js');
    const { getScheduleFile, saveScheduleFile } = require('../../utils/filesUtils.js');
    getScheduleFile.mockImplementation(() => scheduleMock);
    saveScheduleFile.mockImplementation(() => scheduleMock);
    const eventData = {
      id: 1,
    }
    const event = saveScheduleEvent(eventData, 'delete');
    expect(event).toEqual({
      id: 1,
    });
    expect(scheduleMock.events.length).toEqual(3);
  });


});