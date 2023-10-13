let socket = new WebSocket("ws://localhost:3031");

socket.onopen = function(e) {
  socket.send("Emulator connected!");
};


socket.onmessage = function(event) {
  const state = JSON.parse(event.data);
  // GPIO
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

  // MCP23017
  Object.keys(state)
    .filter(key => key.startsWith('MODULE_'))
    .forEach(mcp23017Module => {
      for(let output in state[mcp23017Module]) {
        const outputElement = document.getElementById(`${mcp23017Module}_${mcp23017Pins.filter(o => o.name == output)[0].pin}`);
        const relayElement = document.getElementById(`${mcp23017Module}_relays_${mcp23017Pins.filter(o => o.name == output)[0].pin}`);
        const relayOutput = document.getElementById(`${mcp23017Module}_relays_output_${mcp23017Pins.filter(o => o.name == output)[0].pin}`);
        if (outputElement) {
          outputElement.classList.remove('output_in','output_out');
          outputElement.classList.add(`output_${state[mcp23017Module][output][0]}`);
          if (outputElement && state[mcp23017Module][output][1]) {
            outputElement.classList.add("output_high");
          } else {
            outputElement.classList.remove("output_high");
          }
          relayElement.classList.remove('output_in','output_out');
          relayElement.classList.add(`output_${state[mcp23017Module][output][0]}`);
          if (relayElement && state[mcp23017Module][output][1]) {
            relayElement.classList.add("output_high");
          } else {
            relayElement.classList.remove("output_high");
          }
          relayOutput.classList.remove('output_in','output_out');
          relayOutput.classList.add(`output_${state[mcp23017Module][output][0]}`);
          if (relayOutput && state[mcp23017Module][output][1]) {
            relayOutput.classList.add("output_high");
          } else {
            relayOutput.classList.remove("output_high");
          }
        }
      }
    })
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