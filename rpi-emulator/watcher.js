const fs = require('fs');
const express = require('express');
const app = express();
const port = 3031;
const expressWs = require('express-ws')(app);

app.use(function (req, res, next) {
  console.log('middleware');
  req.testing = 'testing';
  return next();
});

app.get('/', function (req, res, next) {
  console.log('get route', req.testing);
  res.end();
});

app.ws('/', function (ws, req) {
  ws.on('message', function (msg) {
    console.log(msg);
  });
  console.log('socket', req.testing);
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
