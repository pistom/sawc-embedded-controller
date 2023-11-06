const fs = require('fs');
const yaml = require('js-yaml');

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

  let fileName = './config.yml';
  if (!fs.existsSync('./config.yml')) {
    fileName = './config.default.yml';
  }
  const file = fs.readFileSync(fileName, 'utf8');
  return yaml.load(file);
}

const getScheduleFile = () => {

  let fileName = './schedule.yml';
  if (!fs.existsSync('./schedule.yml')) {
    return {events: []};
  }
  const file = fs.readFileSync(fileName, 'utf8');
  return yaml.load(file);
}

const saveScheduleFile = schedule => {
  fs.writeFileSync('./schedule.yml', yaml.dump(schedule));
}

const saveConfigFile = config => {
  fs.writeFileSync('./config.yml', yaml.dump(config));
}

module.exports = {
  getConfigFile,
  getScheduleFile,
  saveConfigFile,
  emptyFile,
  createFileIfNotExists,
  deleteFile,
  saveScheduleFile,
};