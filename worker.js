const e = require("express");
const { Manager } = require("socket.io-client");
const { createFileIfNotExists } = require("./utils/filesUtils");
require('./config.js').getConfig();
const lastMinuteData = [];

const manager = new Manager("http://localhost:3001", {
  reconnectionDelayMax: 10000,
});

const socket = manager.socket("/", {
  auth: {
    token: require('./config.js').config.preferences?.token.toString(),
  }
});

socket.on("connect", () => {
  console.log('Connected to server');
});
socket.on("welcome_message", (data) => {
  console.log(`Server says: ${data.message}`);
});

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const filterScheduleEventsToWaterToday = () => {
  const allScheduleEvents = require('./utils/filesUtils').getScheduleFile().events;
  return allScheduleEvents
    // Filter out events that are not scheduled to run today
    .filter(event => {
      if (new Date(event.startDate) <= new Date()) {
        if (!event.endDate) return true;
        if (new Date(event.endDate) >= new Date()) {
          return true;
        }
      }
      return false;
    })
    // Filter out events that days are not today
    .filter(event => {
      if (!event.days) return true;
      if (event.days) {
        if (event.days.includes(weekdays[new Date().getDay()])) {
          return true;
        }
      }
      return false;
    })
    // Filter out events that do not repeat today
    .filter(event => {
      if (!event.repeatEvery) return true;
      if (event.repeatEvery) {
        const eventDate = new Date(event.startDate);
        eventDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(today - eventDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays % event.repeatEvery === 0) {
          return true;
        }
      }
      return false;
    })
}

const getTimeString = (date = new Date(), seconds = false) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  if (seconds) {
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
  return `${hours}:${minutes}`;
}

const getDataForStartWaterNow = (events) => {
  const data = [];
  events.forEach(event => {
    event.watering.forEach((watering, index) => {
      if (lastMinuteData.find(item => item[1] === `${event.id}-${index}`)) return;
      if (watering.time === getTimeString()) {
        data.push({
          device: event.device,
          output: event.output,
          volume: watering.volume,
          dateTime: new Date(),
          eventId: event.id,
          wateringIndex: index,
        });
      }
    })
  })
  return data;
}

const logWateringDataInAFile = (data) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const fileName = `watering_${year}-${month}-${day}.log`;
  require('./utils/filesUtils').createDirectoryIfNotExists('logs');
  require('./utils/filesUtils').createFileIfNotExists(`logs/${fileName}`, '');
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  let line = `[${dateStr} ${getTimeString()}] `;
  line += `Type: ${data.type}, `;
  line += `Device: ${data.device}, `;
  line += `Output: ${data.output}, `;
  line += `Status: ${data.status}, `;
  line += `Duration: ${data.duration} s, `;
  line += `Send startWater at: ${data.dateTime}, `;
  if (data.context) {
    line += `Context: ${JSON.stringify(data.context)}, `;
  }
  require('./utils/filesUtils').appendFile(`logs/${fileName}`, line);
}

socket.on("message", (message) => {
  if (message.status === 'watering') {
    logWateringDataInAFile(message);
  }
  if (message.status === 'done') {
    logWateringDataInAFile(message);
  }
});

const removeOlderThanOneMinuteData = (lastMinuteData) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - 1);
  lastMinuteData.forEach((item, index) => {
    if (item[0] < date) {
      lastMinuteData.splice(index, 1);
    }
  });
}

setInterval(() => {
  const events = filterScheduleEventsToWaterToday();
  const data = getDataForStartWaterNow(events);
  data.forEach(data => {
    lastMinuteData.push([new Date(), `${data.eventId}-${data.wateringIndex}`]);
    socket.emit('message', { action: 'startWater', ...data, type: 'scheduled', context: {scheduleEventId: data.eventId} });
  });
  removeOlderThanOneMinuteData(lastMinuteData);
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  socket.emit('message', { action: 'heartbeat', process: 'worker', memory: `${Math.round(used * 100) / 100} MB` });
}, 5000);

socket.on("disconnect", () => {
  console.log('Disconnected from server');
});