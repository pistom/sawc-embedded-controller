const fs = require('fs');
const { createFileIfNotExists, stateFile } = require('./utils');

function writeStatus(device, pin, status, dir) {
  createFileIfNotExists(stateFile);
  const fileContent = fs.readFileSync(stateFile, 'utf8')
  if (fileContent) {
    const state = JSON.parse(fileContent);
    if (!state[device]) {
      state[device] = {};
    }
    if (!state[device][pin]) {
      state[device][pin] = [];
    }
    state[device][pin] = [dir, status];
    fs.writeFile(stateFile, JSON.stringify(state), (err) => {
      if (err) throw err;
    });
  }
}

function Gpio(number, direction) {
  writeStatus('GPIO', number, 0, direction);
  return {
    direction,
    writeSync: function (value) {
      writeStatus('GPIO', number, value, this.direction);
    }
  };
}

module.exports = {
  Gpio,
};