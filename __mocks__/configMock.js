const configMock = {
  devices: {
    'MODULE_01': {
      settings: {
        maxVolumePerOutput: 10,
        defaultRatio: .85,
        calibrateDuration: 10,
      },
      type: "mcp23x17",
      outputs: {
        '1': {
          pin: 8,
          ratio: .5,
        },
        '2': {
          pin: 6,
          ratio: .25,
        },
        '3': {
          pin: 9,
          ratio: .25,
        },
        'pump': {
          pin: 7,
          disabled: false,
        }
      }
    }
  }
};

module.exports = {
  configMock,
}