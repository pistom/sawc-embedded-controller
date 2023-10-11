// const sleep = sec => new Promise(r => setTimeout(r, sec * 1000));
function sleep(duration) {
  let timeoutId;
  let resolveFunction;
  const promise = new Promise(resolve => {
    resolveFunction = resolve;
    timeoutId = setTimeout(resolve, duration*1000);
  });
  const sleepObject = {
    promise,
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