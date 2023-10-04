const fs = require('fs');
const stateFile = './rpi-emulator/state.json';

const createFileIfNotExists = fileName => {
  try {
    fs.accessSync(fileName, fs.constants.F_OK);
  } catch (err) {
    fs.writeFileSync(fileName, '{}');
  }
}

const emptyFile = fileName => {
  fs.writeFileSync(fileName, '{}');
}

const deleteFile = fileName => {
  fs.unlinkSync(fileName);
}

module.exports = {
  stateFile,
  emptyFile,
  createFileIfNotExists,
};