const getLogs = (type, startDate, days = 7) => {
  const fs = require('fs');
  let logs = '';
  const date = startDate ? new Date(startDate) : new Date();
  for (let i = 0; i < days; i++) {
    const dateString = require('./dateUtils').getDateString(date);
    const logFile = `${__dirname}/../logs/${type}_${dateString}.log`;
    if (fs.existsSync(logFile)) {
      logs += `————————————\n ${dateString}\n————————————`;
      logs += inversLogLines(fs.readFileSync(logFile, 'utf8'));
      logs += `\n`;
    }
    date.setDate(date.getDate() - 1);
  }
  return logs;
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
};