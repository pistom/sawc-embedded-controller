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
    await sleep(1).promise;
    // TODO: Request to network module
    console.dir(`Output ${this.output} is ON${duration ? ` for ${duration} seconds` : ''}`)
  }

  async outputOff() {
    await sleep(1).promise;
    // TODO: Request to network module
    console.dir(`Output ${this.output} is OFF`)
  }
}

module.exports = NetworkOutput;
