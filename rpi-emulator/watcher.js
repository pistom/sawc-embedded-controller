const fs = require('fs');
const express = require('express');
const app = express();
const port = 3031;
const expressWs = require('express-ws')(app);

app.ws('/', function (ws, req) {
  ws.on('message', function (msg) {
    console.log(msg);
  });
});

let fileContent = '';
fs.watch('./rpi-emulator/state.json', (eventType, filename) => {
  const newFileContent = fs.readFileSync('./rpi-emulator/state.json', 'utf8');
  if (newFileContent && fileContent !== newFileContent) {
    expressWs.getWss('/').clients.forEach(client => {
      client.send(newFileContent);
    });
    fileContent = newFileContent;
  }
});

app.listen(port, () => {
  console.log(`RPI emulator listening on port ${port}`);
})
