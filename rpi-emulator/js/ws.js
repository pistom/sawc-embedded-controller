let socket = new WebSocket("ws://localhost:3031");

socket.onopen = function(e) {
  socket.send("Emulator connected!");
};
socket.onmessage = function(event) {
  const state = JSON.parse(event.data);
  const gpioState = state.GPIO;
  for (const key in gpioState) {
    const gpio = document.getElementById(`GPIO${key}`);
    if (gpio) {
      gpio.classList.remove('gpio_in','gpio_out');
      gpio.classList.add(`gpio_${gpioState[key][0]}`);
      if (gpio && gpioState[key][1]) {
        gpio.classList.add("gpio_high");
      } else {
        gpio.classList.remove("gpio_high");
      }
    }
  }
};

socket.onclose = function(event) {
  if (event.wasClean) {
    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    console.log('[close] Connection died');
  }
  window.location.reload();
};

socket.onerror = function(error) {
  alert(`[error] ${error.message}`);
};