let socket = new WebSocket("ws://localhost:3031");

socket.onmessage = function(event) {
  const state = JSON.parse(event.data);
  const gpioState = state.GPIO;
  for (const key in gpioState) {
    console.dir(key);
    const element = document.getElementById(`gpio_${key}`);
    if (element) {
      console.dir(gpioState[key]);
      element.innerHTML = gpioState[key] ? "HIGH" : "LOW";
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
  alert(`[error]`);
};