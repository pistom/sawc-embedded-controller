# Smart Automatic Watering Conroller

This is a Raspberry Pi Node.js application that provide websocket server to manage pumps and water solenoid valves.

You can use it for watering plants systems.

### Devices connection diagram

![Devices connection diagram](https://raw.githubusercontent.com/pistom/sawc-embedded-controller/main/rpi-emulator/images/diagram.svg)

## Emulator
The app automatically detects whether it is running on the device and provides a web application to emulate devices behaviour during development.

### GUI

[Here](https://github.com/pistom/sawc-embedded-app) you can find an example of a GUI application

## Develop

Run
```bash
yarn dev
```
to start the server and emulator apps

Run
```bash
node server.js
```
to start the server on your Raspberry Pi 