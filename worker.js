const { Manager } = require("socket.io-client");
require('./config.js').getConfig();

const manager = new Manager("http://localhost:3001", {
  reconnectionDelayMax: 10000,
});

const socket = manager.socket("/", {
  auth: {
    token: require('./config.js').config.preferences?.token.toString(),
  }
});

socket.on("connect", () => {
  console.log('Connected to server');
});
socket.on("welcome_message", (data) => {
  console.log(data.message);
});

socket.on("message", (message) => {
  console.log(message);
});

socket.on("disconnect", () => {
  console.log('Disconnected from server');
});