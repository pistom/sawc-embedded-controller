let pins = [
  {name: "3.3V", number: 1},
  {name: "5V", number: 2},
  {name: "GPIO2", number: 3},
  {name: "5V", number: 4},
  {name: "GPIO3", number: 5},
  {name: "GND", number: 6},
  {name: "GPIO4", number: 7},
  {name: "GPIO14", number: 8},
  {name: "GND", number: 9},
  {name: "GPIO15", number: 10},
  {name: "GPIO17", number: 11},
  {name: "GPIO18", number: 12},
  {name: "GPIO27", number: 13},
  {name: "GND", number: 14},
  {name: "GPIO22", number: 15},
  {name: "GPIO23", number: 16},
  {name: "3.3V", number: 17},
  {name: "GPIO24", number: 18},
  {name: "GPIO10", number: 19},
  {name: "GPIO9", number: 20},
  {name: "GND", number: 21},
  {name: "GPIO25", number: 22},
  {name: "GPIO11", number: 23},
  {name: "GPIO8", number: 24},
  {name: "GPIO7", number: 25},
  {name: "GND", number: 26},
  {name: "GPIO0", number: 27},
  {name: "GPIO1", number: 28},
  {name: "GPIO5", number: 29},
  {name: "GND", number: 30},
  {name: "GPIO6", number: 31},
  {name: "GPIO12", number: 32},
  {name: "GPIO13", number: 33},
  {name: "GND", number: 34},
  {name: "GPIO19", number: 35},
  {name: "GPIO16", number: 36},
  {name: "GPIO26", number: 37},
  {name: "GPIO20", number: 38},
  {name: "GND", number: 39},
  {name: "GPIO21", number: 40},
];

// On document ready
document.addEventListener("DOMContentLoaded", function(event) {
  let table = document.createElement("table");
  for (let i = 0; i < pins.length; i++) {
    if (i % 2 === 0) {
      row = document.createElement("tr");
      cell = document.createElement("td");
      cell.innerHTML = pins[i].name;
      row.appendChild(cell);
      cell = document.createElement("td");
      cell.innerHTML = pins[i].number;
      row.appendChild(cell);
      cell = document.createElement("td");
      cell.id = `${pins[i].name}`;
      cell.classList.add("gpio");
      row.appendChild(cell);
      table.appendChild(row);
    } else {
      cell = document.createElement("td");
      cell.id = `${pins[i].name}`;
      cell.classList.add("gpio");
      row.appendChild(cell);
      cell = document.createElement("td");
      cell.innerHTML = pins[i].number;
      row.appendChild(cell);
      cell = document.createElement("td");
      cell.innerHTML = pins[i].name;
      row.appendChild(cell);
      table.appendChild(row);
    }
  }
  const test = document.getElementById('gpio');
  test.appendChild(table);
});