const { getScheduleFile, saveScheduleFile } = require("../utils/filesUtils");

const getTimeStringFromDateTimeString = (dateTimeString) => {
  const date = new Date(dateTimeString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}:${minutes}`;
}


const getCommonData = (eventData) => {
  const watering = eventData.watering.map(watering => ({
    time: getTimeStringFromDateTimeString(watering.time),
    volume: watering.volume,
  }));
  const event = {
    type: eventData.type,
    output: eventData.output,
    device: eventData.device,
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
    startDate: eventData.startDate,
    endDate: eventData.endDate,
  };
  return event;
}

const getDataForOnceTypeEvent = (eventData) => {
  const event = {
    ...getCommonData(eventData),
    startDate: eventData.startDate,
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

  const schedule = getScheduleFile();
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
  saveScheduleFile(schedule);
  return event;
}

module.exports = {
  saveScheduleEvent,
  getDataForAlwaysTypeEvent,
  getDataForPeriodTypeEvent,
  getDataForOnceTypeEvent,
};