beforeAll(() => {
  jest.mock('fs');
});
afterAll(() => {
  jest.unmock('fs');
});

describe('filesUtils', () => {
  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('creates file if not exists', async () => {
    const fs = require('fs');
    fs.accessSync = jest.fn().mockImplementation(() => {
      throw new Error('Sync error');
    });
    fs.writeFileSync = jest.fn();
    const { createFileIfNotExists } = require('./filesUtils');
    createFileIfNotExists('test.txt');
    expect(fs.writeFileSync).toHaveBeenCalledWith('test.txt', '{}');
  });

  it('empties file', async () => {
    const fs = require('fs');
    fs.writeFileSync = jest.fn();
    const { emptyFile } = require('./filesUtils');
    emptyFile('test.txt');
    expect(fs.writeFileSync).toHaveBeenCalledWith('test.txt', '{}');
  });

  it('deletes file', async () => {
    const fs = require('fs');
    fs.unlinkSync = jest.fn();
    const { deleteFile } = require('./filesUtils');
    deleteFile('test.txt');
    expect(fs.unlinkSync).toHaveBeenCalledWith('test.txt');
  });

  it('gets config file', async () => {
    const fs = require('fs');
    const yaml = require('js-yaml');
    yaml.load = jest.fn().mockImplementation(() => 'test');
    fs.existsSync = jest.fn().mockImplementation(() => true);
    fs.readFileSync = jest.fn().mockImplementation(() => 'test');
    const { getConfigFile } = require('./filesUtils');
    const config = getConfigFile();
    expect(fs.existsSync).toHaveBeenCalledWith('./config.yml');
    expect(yaml.load).toHaveBeenCalledWith('test');
    expect(config).toEqual('test');
  });

  it('gets default config file', async () => {
    const fs = require('fs');
    const yaml = require('js-yaml');
    yaml.load = jest.fn().mockImplementation(() => 'test');
    fs.existsSync = jest.fn().mockImplementation(() => false);
    fs.readFileSync = jest.fn().mockImplementation(() => 'test');
    const { getConfigFile } = require('./filesUtils');
    const config = getConfigFile();
    expect(fs.existsSync).toHaveBeenCalledWith('./config.yml');
    expect(fs.readFileSync).toHaveBeenCalledWith('./config.default.yml', 'utf8');
    expect(yaml.load).toHaveBeenCalledWith('test');
    expect(config).toEqual('test');
  });

  it('saves config file', async () => {
    const fs = require('fs');
    const yaml = require('js-yaml');
    yaml.dump = jest.fn().mockImplementation(() => 'test');
    fs.writeFileSync = jest.fn();
    const { saveConfigFile } = require('./filesUtils');
    saveConfigFile('test');
    expect(yaml.dump).toHaveBeenCalledWith('test');
    expect(fs.writeFileSync).toHaveBeenCalledWith('./config.yml', 'test');
  });
});