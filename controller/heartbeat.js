const heartbeat = (message, io) => {
  io.emit('message', message);
}

module.exports = {
  heartbeat,
}