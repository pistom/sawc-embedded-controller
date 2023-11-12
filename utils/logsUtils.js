const getLogs = (type, startDate, days = 7) => {
  const fs = require('fs');
  let logs = '';
  const date = startDate ? new Date(startDate) : new Date();
  for (let i = 0; i < days; i++) {
    const dateString = require('./dateUtils').getDateString(date);
    const logFile = `${__dirname}/../logs/${type}_${dateString}.log`;
    if (fs.existsSync(logFile)) {
      logs += `┌──────────┐\n│${dateString}│\n└──────────┘`;
      logs += inversLogLines(fs.readFileSync(logFile, 'utf8'));
      logs += `\n`;
    }
    date.setDate(date.getDate() - 1);
  }
  return logs;
}

const log = (type, message) => {
  const fs = require('fs');
  const dateString = require('./dateUtils').getDateString();
  const timeString = require('./dateUtils').getTimeString();
  const fileName = `${__dirname}/../logs/${type}_${dateString}.log`;
  require('./filesUtils').createDirectoryIfNotExists('logs');
  require('./filesUtils').createFileIfNotExists(fileName, '');
  let line = `[${dateString} ${timeString}] `;
  line += message;
  fs.appendFileSync(fileName, `${line}\n`);
}

const logWatering = (data) => {
  let line = `Type: ${data.type || 'manual'}, `;
  line += `Device: ${data.device}, `;
  line += `Output: ${data.output}, `;
  line += `Status: ${data.status}, `;
  if (data.duration) {
    line += `Duration: ${data.duration} s, `;
  }
  if (data.dateTime) {
    line += `Send startWater at: ${data.dateTime}, `;
  }
  if (data.context) {
    line += `Context: ${JSON.stringify(data.context)}, `;
  }
  log('watering', line);
}

const inversLogLines = (logs) => {
  const lines = logs.split('\n');
  let inversLines = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    inversLines += `${lines[i]}\n`;
  }
  return inversLines;
}

module.exports = {
  getLogs,
  log,
  logWatering,
};