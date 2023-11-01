[![Test](https://github.com/pistom/sawc-embedded-controller/actions/workflows/test.yml/badge.svg)](https://github.com/pistom/sawc-embedded-controller/actions/workflows/test.yml)

[![Coverage Statements](https://raw.githubusercontent.com/gist/pistom/365dc9c90edfe42bb84f579461e23a6e/raw/6185012cd70ee2bec260182ccd18c38564d87d5f/badge-statements.svg)](https://github.com/pistom/sawc-embedded-controller/actions)
[![Coverage Branches](https://raw.githubusercontent.com/gist/pistom/365dc9c90edfe42bb84f579461e23a6e/raw/6185012cd70ee2bec260182ccd18c38564d87d5f/badge-branches.svg)](https://github.com/pistom/sawc-embedded-controller/actions)
[![Coverage Functions](https://raw.githubusercontent.com/gist/pistom/365dc9c90edfe42bb84f579461e23a6e/raw/6185012cd70ee2bec260182ccd18c38564d87d5f/badge-functions.svg)](https://github.com/pistom/sawc-embedded-controller/actions)
[![Coverage Lines](https://raw.githubusercontent.com/gist/pistom/365dc9c90edfe42bb84f579461e23a6e/raw/6185012cd70ee2bec260182ccd18c38564d87d5f/badge-lines.svg)](https://github.com/pistom/sawc-embedded-controller/actions)

# Smart Automatic Watering Conroller

System for controlling water pumps and valves. Designed for automatic and/or remote watering of indoor/garden plants.


### GUI

[Here](https://github.com/pistom/sawc-embedded-app) you can find an example of a GUI application

## Develop

```bash
yarn dev
```
to start the server and emulator.

### Emulator
If the application is not running on Raspberry Pi, the server automatically saves the state of inputs/outputs in `emulator/state.json` file. A webpage is available at `http://localhost:3030` displaying a diagram and the status of individual outputs.

![SAWC Emulator](https://gist.github.com/pistom/976790556d4271fd1cca119c9fe11d92/raw/dd8a73a713445f0e408a419521a457c2aa05eaea/sawc01.gif)

## Production (Raspberry PI)

You must have NodeJS installed on your device.

```bash
npm install
node server.js
```
to start the server on your Raspberry Pi 

If you want to run the applications on Raspberry startup (Linux), execute the `install.sh` script
```bash
./install.sh
```
The script will add new services to systemd service manager.

## Communication
By default, the server operates on port 3001. Communication with the server is established using the WebSocket protocol (Socket.IO).
## Messages
### 1. Start water
Opens given output and runs pump.

⚠ One module is designed to have only one pump, so in order to calculate the appropriate amount of water and prevent a significant voltage drop, only one output can be open at the same time.

You can send more `startWater` messages, but they will be added to the queue.
```js
// REQUEST
{ action: 'startWater', device: 'MODULE_01', output: '1', volume: 10 }

// ANSWERS
// Get remaining times of watering queue
{ 
  status: "remainingTimes",
  device: "MODULE_01",
  remainingTimes: {
    1: {wateringIn: 0, wateringTime: 3, wateringVolume: 10}
  }
}
// Sent when output starts watering
{ status: "watering", device:"MODULE_01", output: "1", duration: 3 }
// After watering is done
{ status:"done", device: "MODULE_01", output: "1" }

```

### 2. Stop water
Stops pump and closes output. If watering is not started yet, the message is removed from the queue.
```js
// REQUEST
{action: "stopWater", device: "MODULE_01", output: "2"}

// ANSWERS
{ 
  status: "remainingTimes",
  device: "MODULE_01",
  remainingTimes: {...}
}
// If output is watering
{status: "stopped", device: "MODULE_01", output: "2"}
// If output is scheduled
{status: "aborted", device: "MODULE_01", output: "2"}
```

### 3. Get remaining times
Gets remaining times of watering queue
```js
{ action: "getRemainingTimes", ... }
```

### 4. Edit output
Edits output configuration
```js
{ action: "editOutput", ... }
```

### 5. Edit device
Edits device configuration
```js
{ action: "editDevice", ... }
```

### 6. Edit device output
Edits pins and enable/disable outputs
```js
{ action: "editDeviceOutput", ... }
```

### 7. Calibrate output
Starts calibration of a given output. Calibration is needed because the water delivery tubes to the flowers may have varying lengths and different heights, which affects the amount of water being dispensed.
```js
{ action: "calibrate", ... }
```

### 8. Stop calibrating
Stops pump and close calibrating output
```js
{ action: "stopCalibrating", ... }
```

### 9. Calculate ratio
Determines how much water output gives in determines how much water flows from a specific output per second.
```js
{ action: "calculateRatio", ... }
```

## GET Configuration
Configuration is stored in `config.default.yml` (or `config.yml`). It is available at `http://localhost:3001/config`.

### Devices connection diagram example

![Devices connection diagram](https://raw.githubusercontent.com/pistom/sawc-embedded-controller/main/emulator/images/diagram.svg)
