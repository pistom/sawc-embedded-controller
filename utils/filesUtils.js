import * as fs from 'fs';

import yaml from 'js-yaml';

const createDirectoryIfNotExists = (directoryName) => {
  try {
    fs.accessSync(directoryName, fs.constants.F_OK);
  } catch (err) {
    fs.mkdirSync(directoryName);
  }
}

const createFileIfNotExists = (fileName, content = '{}') => {
  try {
    fs.accessSync(fileName, fs.constants.F_OK);
  } catch (err) {
    fs.writeFileSync(fileName, content);
  }
}

const emptyFile = (fileName, content = '{}') => {
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

const writeFile = (fileName, content, type = 'json') => {
  switch (type) {
    case 'json':
      content = JSON.stringify(content);
      break;
    case 'yaml':
      content = yaml.dump(content);
      break;
  }
  fs.writeFileSync(fileName, content);
}

const appendFile = (fileName, content) => {
  fs.appendFileSync(fileName, content + '\n');
}

export {
  getConfigFile,
  getScheduleFile,
  saveConfigFile,
  emptyFile,
  createFileIfNotExists,
  deleteFile,
  saveScheduleFile,
  createDirectoryIfNotExists,
  writeFile,
  appendFile,
};