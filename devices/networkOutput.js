const { sleep } = require("../utils/sleep");

class NetworkOutput {
  
  constructor(deviceConfig, output) {
    this.deviceConfig = deviceConfig;
    this.output = output;
  }

  async write(on, duration = false) {
    switch (on) {
      case 0:
        await this.outputOn(duration);
        break;
      case 1:
        await this.outputOff();
        break;
    }
  }

  async outputOn(duration) {
    const response = await this.requestDevice('on', duration);
    // TODO: handle not ok case
    // if (!response.ok)
  }

  async outputOff() {
    const response = await this.requestDevice('off');
    // TODO: handle not ok case
    // if (!response.ok)
  }

  async requestDevice(type, duration) {
    const address = this.deviceConfig.address;
    const token = this.deviceConfig.token; 
    let url = `${address}/${type}?${this.output === 'pump' ? 'pump' : `output=${this.output}`}&token=${token}`;
    if (duration) {
      url += `&duration=${duration}`;
    }
    return fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

  }
}

module.exports = NetworkOutput;
