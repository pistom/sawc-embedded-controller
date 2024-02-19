import * as fs from 'fs'; 
import { getDateString, getTimeString } from './dateUtils.js';
import { createDirectoryIfNotExists, createFileIfNotExists } from './filesUtils.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const getLogs = (type, startDate, days = 7) => {
  let logs = '';
  const date = startDate ? new Date(startDate) : new Date();
  for (let i = 0; i < days; i++) {
    const dateString = getDateString(date);
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
  const dateString = getDateString();
  const timeString = getTimeString();
  const fileName = `${__dirname}/../logs/${type}_${dateString}.log`;
  createDirectoryIfNotExists('logs');
  createFileIfNotExists(fileName, '');
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
 
const syslog = (data) => {
  let level = 'INFO';
  switch (data.level) {
    case 'error':
      level = 'ERROR';
      break;
    case 'warning':
      level = 'WARNING';
      break;
    default:
      level = 'INFO';
      break;
  }
  let line = `${level}: `;
  line += `Message: ${data.message}, `;
  if (data.context) {
    line += `Context: ${JSON.stringify(data.context)}, `;
  }
  log('syslog', line);
}

const inversLogLines = (logs) => {
  const lines = logs.split('\n');
  let inversLines = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    inversLines += `${lines[i]}\n`;
  }
  return inversLines;
}

export {
  getLogs,
  log,
  logWatering,
  syslog,
};