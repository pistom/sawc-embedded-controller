const fetch = require('node-fetch');
const https = require('https');

class NetworkOutput {

  constructor(deviceConfig, output) {
    this.deviceConfig = deviceConfig;
    this.output = output;
  }

  async write(on, duration = null, nextOutput = null) {
    switch (on) {
      case 0:
        await this.outputOn(duration);
        break;
      case 1:
        await this.outputOff(nextOutput);
        break;
    }
  }

  async outputOn(duration) {
    const response = await this.requestDevice('on', duration);
    if (!response.ok) {
      this.throwError(response.status);
    }
  }

  async outputOff(nextOutput) {
    const response = await this.requestDevice('off', null, nextOutput);
    if (!response.ok) {
      this.throwError(response.status);
    }
  }

  async requestDevice(action, duration, nextOutput = null) {
    const address = this.deviceConfig.address;
    const token = this.deviceConfig.token;
    let url = `${address}/output`;
    let body = `token=${token}&output=${this.output}&action=${action}`;
    if (duration) {
      body += `&duration=${duration}`;
    }
    if (this.deviceConfig.outputs['pump'] && !this.deviceConfig.outputs['pump'].disabled) {
      const delay = this.deviceConfig.outputs['pump'].delayOff / 1000 || 0;
      body += `&pumpDelayOff=${Math.ceil(delay)}`;
    }
    if (nextOutput) {
      body += `&nextOutput=${nextOutput}`;
    }
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    return fetch(url, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'text/plain' },
      agent: httpsAgent,
    });
  }
  
  throwError(status) {
    switch (status) {
      case 404:
        throw new Error("Not found", { "cause": { "errno": -123 } });
      case 401:
        throw new Error("Unauthorized", { "cause": { "errno": "INVALIDTOKEN" } });
    }
  }

}

module.exports = NetworkOutput;
