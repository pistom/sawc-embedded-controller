function sleep(duration) {
  let timeoutId;
  let resolveFunction;
  const startTime = Date.now();
  const promise = new Promise(resolve => {
    resolveFunction = resolve;
    timeoutId = setTimeout(resolve, duration * 1000);
  });
  const sleepObject = {
    promise,
    elapsedTime: () => {
      return (Date.now() - startTime) / 1000; // Get the elapsed time
    },
    abort: () => {
      clearTimeout(timeoutId);
      resolveFunction();
    }
  };
  return sleepObject;
}

module.exports = {
  sleep,
}