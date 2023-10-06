const express = require('express');
const cors = require('cors');
const isPi = require('detect-rpi');
const app = express();
const port = 3001;
app.use(cors());

const { startWater, stopWater } = require('./controller/controller.js');
const { setGpio } = require('./devices/gpio.js');


app.get('/water/:device/:output/:duration', async (req, res) => {
  await startWater(
    req.params.device,
    req.params.output,
    parseInt(req.params.duration));
  res.json({ status: 'success', device: req.params.device, output: req.params.output });
});

app.get('/stop-water/:device/:output', async (req, res) => {
  stopWater(
    req.params.device,
    req.params.output);
  res.json({ status: 'aborted', device: req.params.device, output: req.params.output });
});


app.get('/gpio/:number/:state', (req, res) => {
  setGpio(req.params.number, 'out', req.params.state === 'on' ? 1 : 0);
  res.json({ status: 'success' });
});

app.listen(port, () => {
  console.log(`SAWC controller listening on port ${port} (${isPi() ? 'on' : 'off'} a Raspberry Pi)`);
})
