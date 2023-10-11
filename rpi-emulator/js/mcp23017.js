let mcp23017Pins = [
  { name: "8", pin: "B0" },
  { name: "7", pin: "A7" },
  { name: "9", pin: "B1" },
  { name: "6", pin: "A6" },
  { name: "10", pin: "B2" },
  { name: "5", pin: "A5" },
  { name: "11", pin: "B3" },
  { name: "4", pin: "A4" },
  { name: "12", pin: "B4" },
  { name: "3", pin: "A3" },
  { name: "13", pin: "B5" },
  { name: "2", pin: "A2" },
  { name: "14", pin: "B6" },
  { name: "1", pin: "A1" },
  { name: "15", pin: "B7" },
  { name: "0", pin: "A0" }
];

// On document ready
document.addEventListener("DOMContentLoaded", function (event) {
  const sawcModules = document.querySelectorAll('.mcp23017_module');
  sawcModules.forEach((sawcModule) => {
    const modulePins = sawcModule.querySelector('.mcp23017_pins');
    const relaysPins = sawcModule.querySelector('.mcp23017_relays_pins');
    const relaysOutputs = sawcModule.querySelector('.mcp23017_relays_outputs');
    for (let i = 0; i < mcp23017Pins.length; i++) {
      const pin = document.createElement("span");
      pin.id = `${sawcModule.id}_${mcp23017Pins[i].pin}`;
      pin.classList.add("module", "module_pin");
      modulePins.appendChild(pin);
      const relayPin = document.createElement("span");
      relayPin.id = `${sawcModule.id}_relays_${mcp23017Pins[i].pin}`;
      relayPin.classList.add("module", "module_pin", `relay_${mcp23017Pins[i].pin}`);
      relaysPins.appendChild(relayPin);
      const relayOutputArrows = document.createElement("span");
      const relayOutput = document.createElement("span");
      relayOutput.appendChild(relayOutputArrows);
      relayOutput.id = `${sawcModule.id}_relays_output_${mcp23017Pins[i].pin}`;
      relayOutput.classList.add("module", "module_output", `relay_output_${mcp23017Pins[i].pin}`);
      relaysOutputs.appendChild(relayOutput);
    }
  });
});