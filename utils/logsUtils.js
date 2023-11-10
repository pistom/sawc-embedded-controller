const getLogs = (type, startDate, days = 7) => {
  const fs = require('fs');
  let logs = '';
  const date = startDate ? new Date(startDate) : new Date();
  for (let i = 0; i < days; i++) {
    const dateString = require('./dateUtils').getDateString(date);
    const logFile = `${__dirname}/../logs/${type}_${dateString}.log`;
    if (fs.existsSync(logFile)) {
      logs += `${dateString}\n`;
      logs += fs.readFileSync(logFile);
      logs += `\n`;
    }
    date.setDate(date.getDate() - 1);
  }
  return logs;
}



module.exports = {
  getLogs,
};