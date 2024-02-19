import * as fs from 'fs';
import express from 'express';
import { createFileIfNotExists, emptyFile } from '../utils/filesUtils';
const app = express();
const port = 3031;
import expressWs from 'express-ws';
expressWs(app)
const stateFile = './emulator/state.json';
createFileIfNotExists(stateFile);
emptyFile(stateFile);

app.ws('/', function (ws, req) {
  ws.on('message', function (msg) {
    ws.send(fs.readFileSync(stateFile, 'utf8'));
    dispatchState();
  });
});

let fileContent = '';
function dispatchState() {
  fs.watch(stateFile, () => {
    const newFileContent = fs.readFileSync(stateFile, 'utf8');
    if (newFileContent && fileContent !== newFileContent) {
      expressWs.getWss('/').clients.forEach(client => {
        client.send(newFileContent);
      });
      fileContent = newFileContent;
    }
  });
}

app.listen(port, () => {
  console.log(`RPI emulator listening on port ${port}`);
})
