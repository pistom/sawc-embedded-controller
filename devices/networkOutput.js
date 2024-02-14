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
    try {
      const response = await this.requestDevice('on', duration);
      console.dir(`Output ${this.output} is ON${duration ? ` for ${duration} seconds` : ''}`);
      // TODO: handle not ok case
      // if (!response.ok)
    } catch (e) {
      console.error(e.cause)
    }
  }

  async outputOff() {
    try {
      const response = await this.requestDevice('off');
      console.dir(`Output ${this.output} is OFF`);
      // TODO: handle not ok case
      // if (!response.ok)
    } catch (e) {
      console.error(e.cause);
    }
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
