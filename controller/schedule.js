const { getScheduleFile, saveScheduleFile } = require("../utils/filesUtils");

const getTimeStringFromDateTimeString = (dateTimeString) => {
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(dateTimeString)) return dateTimeString;
  const date = new Date(dateTimeString);
  if (date.toString() === 'Invalid Date') return '00:00';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

const getDateStringFromDateTimeString = (dateTimeString) => {
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(dateTimeString)) return null;
  const date = new Date(dateTimeString);
  if (date.toString() === 'Invalid Date') return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const getCommonData = (eventData) => {
  const watering = eventData.watering.map(watering => ({
    time: getTimeStringFromDateTimeString(watering.time),
    volume: watering.volume,
  }));
  const event = {
    type: `${eventData.type}`,
    output: `${eventData.output}`,
    device: `${eventData.device}`,
    startDate: getDateStringFromDateTimeString(eventData.startDate),
    watering,
  };
  return event;
}

const getRepeatData = (eventData) => {
  const event = {}
  if (eventData.days && eventData.days.length > 0) {
    event.days = eventData.days;
  } else if (eventData.repeatEvery && eventData.repeatEvery > 0 && eventData.repeatEvery < 365) {
    event.repeatEvery = eventData.repeatEvery;
  }
  return event;
}

const getDataForAlwaysTypeEvent = (eventData) => {
  const event = {
    ...getCommonData(eventData),
    ...getRepeatData(eventData),
  };
  return event;
}

const getDataForPeriodTypeEvent = (eventData) => {
  const event = {
    ...getCommonData(eventData),
    ...getRepeatData(eventData),
    endDate: getDateStringFromDateTimeString(eventData.endDate),
  };
  return event;
}

const getDataForOnceTypeEvent = (eventData) => {
  const event = {
    ...getCommonData(eventData),
  };
  return event;
}

const getLastEventId = (schedule) => {
  if (!schedule.events) schedule.events = [];
  if (schedule.events.length === 0) {
    return 0;
  }
  return schedule.events.reduce((acc, curr) => {
    if (curr.id > acc) return curr.id
    return acc;
  }, 0);
}

const saveScheduleEvent = (eventData, action = 'add') => {
  let event = {};
  switch (eventData.type) {
    case 'always':
      event = getDataForAlwaysTypeEvent(eventData);
      break;
    case 'period':
      event = getDataForPeriodTypeEvent(eventData);
      break;
    case 'once':
      event = getDataForOnceTypeEvent(eventData);
      break;
  }

  const schedule = require('../utils/filesUtils').getScheduleFile();
  if (action === 'edit') {
    const eventIndex = schedule.events.findIndex(e => e.id === eventData.id);
    if (eventIndex > -1) {
      event.id = eventData.id;
      schedule.events[eventIndex] = event;
    }
  } else if (action === 'delete') {
    const eventIndex = schedule.events.findIndex(e => e.id == eventData.id);
    if (eventIndex > -1) {
      event.id = eventData.id;
      schedule.events.splice(eventIndex, 1);
    }
  } else if (action === 'add') {
    event.id = getLastEventId(schedule) + 1;
    schedule.events.push(event);
  }
  require('../utils/filesUtils').saveScheduleFile(schedule);
  return event;
}

module.exports = {
  saveScheduleEvent,
  getDataForAlwaysTypeEvent,
  getDataForPeriodTypeEvent,
  getDataForOnceTypeEvent,
};