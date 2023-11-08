const { getConfigFile, saveConfigFile } = require('./utils/filesUtils');

const config = {
  preferences: {},
  devices: {},
};

const getConfig = () => {
  const configFile = getConfigFile();
  config.devices = configFile.devices;
  config.preferences = configFile.preferences;
}
const saveConfig = (config) => {
  saveConfigFile(config);
  getConfig();
}

module.exports = {
  config,
  getConfig,
  saveConfig,
};