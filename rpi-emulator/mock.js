const fs = require('fs');

function writeStatus(device, pin, status) {
  const state = JSON.parse(fs.readFileSync('./rpi-emulator/state.json', 'utf8'));
  if (!state[device]) {
    state[device] = {};
  }
  state[device][pin] = status;
  fs.writeFile('./rpi-emulator/state.json', JSON.stringify(state), (err) => {
    if (err) throw err;
  });
}

function Gpio(number, direction) {
  return {
    writesync: (value) => {
      writeStatus('GPIO', number, value);
    }
  };
}

module.exports = {
  Gpio,
};