const { getConfigFile } = require('./utils/filesUtils');

const config = {
  preferences: {},
  devices: {},
};

const getConfig = () => {
  const configFile = getConfigFile();
  config.devices = configFile.devices;
  config.preferences = configFile.preferences;
}

module.exports = {
  config,
  getConfig,
};