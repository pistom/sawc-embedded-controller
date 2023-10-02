const fs = require('fs');
const stateFile = './rpi-emulator/state.json';

const createFileIfNotExists = fileName => {
  try {
    fs.accessSync(fileName, fs.constants.F_OK);
  } catch (err) {
    fs.writeFileSync(fileName, '{}');
  }
}

module.exports = {
  stateFile,
  createFileIfNotExists,
};