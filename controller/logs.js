const syslog = message => {
  const { syslog } = require('../utils/logsUtils');
  syslog(message);
}

module.exports = {
  syslog,
}