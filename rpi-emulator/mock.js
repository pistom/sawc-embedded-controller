const { MODE_OUTPUT } = require('@mrvanosh/mcp23x17');
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
    fs.writeFileSync(stateFile, JSON.stringify(state));
  }
}

function Gpio(number, direction) {
  writeStatus('GPIO', number, 0, direction);
  return {
    direction,
    writeSync: function (value) {
      writeStatus('GPIO', number, value, this.direction);
    },
    unexport: function () {
      writeStatus('GPIO', number, 0, this.direction);
    }
  };
}

function MCP23x17(device) {
  return {
    begin: function () {
      return new Promise((resolve, reject) => {
        resolve();
      });
    },
    mode: function (pin, mode, value) {
      writeStatus(device, pin, value, mode === MODE_OUTPUT ? 'out' : 'in');
      return new Promise((resolve, reject) => {
        resolve({
          write: function (value) {
            writeStatus(device, pin, value, mode === MODE_OUTPUT ? 'out' : 'in');
          }
        });
      });
    }
  }
}

module.exports = {
  Gpio,
  MCP23x17,
};