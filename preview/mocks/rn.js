// react-native → react-native-web 聚合出口，补齐 RNW 未实现的 API
import { Platform as RNWPlatform } from 'react-native-web'

export * from 'react-native-web'

// RN 原生 Platform 有 constants（含 Release/Version 等），RNW 没有
export const Platform = {
  ...RNWPlatform,
  OS: 'android',
  Version: 30,
  isPad: false,
  isTV: false,
  constants: {
    Release: '13',
    Version: 30,
    Model: 'Preview Device',
    Brand: 'preview',
    Manufacturer: 'preview',
    ServerHost: '',
    uiMode: 'normal',
    reactNativeVersion: { major: 0, minor: 76, patch: 0 },
  },
}

// RNW 的 Dimensions 初始可能为 0，这里直接读 window 保证任何时刻非 0
import { Dimensions as RNWDimensions } from 'react-native-web'
const winDims = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
  scale: window.devicePixelRatio || 1,
  fontScale: 1,
})
export const Dimensions = {
  ...RNWDimensions,
  get(dim) {
    if (dim === 'window') return winDims()
    if (dim === 'screen') {
      return { width: window.screen.width, height: window.screen.height, scale: window.devicePixelRatio || 1, fontScale: 1 }
    }
    return RNWDimensions.get(dim)
  },
  addEventListener(...args) {
    return RNWDimensions.addEventListener(...args)
  },
  removeEventListener(...args) {
    return RNWDimensions.removeEventListener(...args)
  },
}

export const PermissionsAndroid = {
  PERMISSIONS: {
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
    POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
  },
  RESULTS: { GRANTED: 'granted', DENIED: 'denied', NEVER_ASK_AGAIN: 'never_ask_again' },
  async request() { return 'granted' },
  async requestMultiple() { return {} },
  async check() { return true },
}

export const ToastAndroid = {
  SHORT: 0,
  LONG: 1,
  TOP: 1,
  BOTTOM: 2,
  CENTER: 3,
  show(message) { console.log('[Toast]', message) },
  showWithGravity(message, _dur, _grav) { console.log('[Toast]', message) },
  showWithGravityAndOffset(message) { console.log('[Toast]', message) },
}

export const LayoutAnimation = {
  configureNext() {},
  create() { return {} },
  Types: {}, Properties: {}, Animations: { easeInEaseOut: null, linear: null, spring: null },
  Presets: { easeInEaseOut: {}, linear: {}, spring: {} },
}

export const NativeEventEmitter = class {
  constructor() {}
  addListener() { return { remove() {} } }
  removeAllListeners() {}
}

// 按需代理任意原生模块：每个方法返回 Promise.resolve()
// 个别方法需要真实形状的数据，否则上层解构/取属性会炸
const methodDefaults = {
  getWindowSize: { width: 393, height: 852, statusBarHeight: 24, navigationBarHeight: 24 },
  getSystemLocales: 'zh-CN',
  getSupportedAbis: ['arm64-v8a'],
  getWIFIIPV4Address: '192.168.1.10',
  getDeviceName: 'Preview Device',
  isNotificationsEnabled: true,
  isIgnoringBatteryOptimization: true,
  checkNotificationPermission: true,
}
const nativeModuleProxy = new Proxy({}, {
  get(_t, moduleName) {
    if (typeof moduleName !== 'string' || moduleName === 'then') return undefined
    return new Proxy({}, {
      get(_t2, method) {
        if (typeof method !== 'string' || method === 'then') return undefined
        return (...args) => Promise.resolve(method in methodDefaults ? methodDefaults[method] : undefined)
      },
    })
  },
})

export const NativeModules = nativeModuleProxy

export const BackAndroid = {
  addEventListener() { return { remove() {} } },
  removeEventListener() {},
  exitApp() {},
}
