import { getConfigFile, saveConfigFile } from './utils/filesUtils.js';

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

export {
  config,
  getConfig,
  saveConfig,
};