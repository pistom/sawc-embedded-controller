import { syslog } from '../utils/logsUtils.js';

const syslog = message => {
  syslog(message);
}

export {
  syslog,
}