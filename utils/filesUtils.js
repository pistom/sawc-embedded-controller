const fs = require('fs');

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

const getConfigFile = () => {
  const file = fs.readFileSync('./config.json', 'utf8');
  return JSON.parse(file);
}

module.exports = {
  getConfigFile,
  emptyFile,
  createFileIfNotExists,
};