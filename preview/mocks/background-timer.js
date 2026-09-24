// BackgroundTimer → 全局定时器
const BackgroundTimer = {
  setTimeout: (...args) => setTimeout(...args),
  clearTimeout: (...args) => clearTimeout(...args),
  setInterval: (...args) => setInterval(...args),
  clearInterval: (...args) => clearInterval(...args),
  setTimeoutBackground: (...args) => setTimeout(...args),
  clearTimeoutBackground: (...args) => clearTimeout(...args),
  setIntervalBackground: (...args) => setInterval(...args),
  clearIntervalBackground: (...args) => clearInterval(...args),
  start: () => {},
  stop: () => {},
  runBackgroundTimer: () => {},
  stopBackgroundTimer: () => {},
}
export default BackgroundTimer
