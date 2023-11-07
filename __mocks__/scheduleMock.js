const scheduleMock = {
  events: [{
    id: 1,
    type: 'always',
    output: 1,
    device: 'MODULE_01',
    days: ['Monday', 'Tuesday'],
    watering: [{ time: '12:00', volume: 100 }],
  }, {
    id: 2,
    type: 'always',
    output: 1,
    device: 'MODULE_01',
    days: ['Monday', 'Tuesday'],
    watering: [{ time: '12:00', volume: 100 }],
  }, {
    id: 3,
    type: 'always',
    output: 1,
    device: 'MODULE_01',
    days: ['Monday', 'Tuesday'],
    watering: [{ time: '12:00', volume: 100 }],
  }, {
    id: 4,
    type: 'always',
    output: 1,
    device: 'MODULE_01',
    days: ['Monday', 'Tuesday'],
    watering: [{ time: '12:00', volume: 100 }],
  }]
}

module.exports = scheduleMock;