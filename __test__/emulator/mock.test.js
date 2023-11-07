describe('mock', () => {
  test('MCP23017', async () => {
    const { MCP23x17 } = require('../../emulator/mock');
    const mcp = MCP23x17('MODULE_01');
    await mcp.begin();
    const pin = 1;
    const mode = 1;
    const value = 1;
    const promise = mcp.mode(pin, mode, value);
    await promise.then((gpio) => {
      expect(gpio.write).toBeDefined();
      expect(gpio.write).toBeInstanceOf(Function);
      gpio.write(1);
    });
  });

  test('Gpio', async () => {
    const { Gpio } = require('../../emulator/mock');
    const gpio = Gpio(1, 'out');
    expect(gpio.direction).toBe('out');
    expect(gpio.writeSync).toBeDefined();
    expect(gpio.writeSync).toBeInstanceOf(Function);
    expect(gpio.unexport).toBeDefined();
    expect(gpio.unexport).toBeInstanceOf(Function);
    gpio.writeSync(1);
    gpio.unexport();
  });

});
