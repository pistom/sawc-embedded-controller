function sleep(duration) {
  let timeoutId;
  let resolveFunction;
  let rejectFunction;
  const startTime = Date.now();
  const promise = new Promise((resolve, reject) => {
    resolveFunction = resolve;
    rejectFunction = reject;
    timeoutId = setTimeout(resolve, duration * 1000);
  });
  const sleepObject = {
    promise,
    elapsedTime: () => {
      return (Date.now() - startTime) / 1000; // Get the elapsed time
    },
    resume: () => {
      clearTimeout(timeoutId);
      resolveFunction();
    },
    cancel: () => {
      clearTimeout(timeoutId);
      rejectFunction();
    }
  };
  return sleepObject;
}

module.exports = {
  sleep,
}