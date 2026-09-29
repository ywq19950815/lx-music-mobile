// react-native → react-native-web 聚合出口，补齐 RNW 未实现的 API
import { Platform as RNWPlatform } from 'react-native-web'
// 预览专用：真跑 lx 音源脚本的沙箱（真机上是原生 UserApiModule）
import UserApiModule from './user-api.js'

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

// Dimensions 锁定在手机框逻辑尺寸（与 index.html 的 #phone 393x852 一致）。
// 不能读 window.innerWidth/innerHeight：外部浏览器全屏打开时 RN 会把整个
// 浏览器窗口当屏幕，布局被拉伸铺满全屏（样式散掉）。
const PHONE_W = 393
const PHONE_H = 852
const WIN_DIMS = {
  width: PHONE_W,
  height: PHONE_H,
  scale: 2,
  fontScale: 1,
}
import { Dimensions as RNWDimensions } from 'react-native-web'
const winDims = () => WIN_DIMS
export const Dimensions = {
  ...RNWDimensions,
  get(dim) {
    if (dim === 'window') return winDims()
    if (dim === 'screen') return winDims()
    return RNWDimensions.get(dim)
  },
  addEventListener(...args) {
    return RNWDimensions.addEventListener(...args)
  },
  removeEventListener(...args) {
    return RNWDimensions.removeEventListener(...args)
  },
}

// 覆盖 RNW 的 useWindowDimensions：其内部实现监听真实浏览器窗口，
// 外部浏览器全屏打开时会让使用该 hook 的组件拿到整窗尺寸导致布局散架
export const useWindowDimensions = () => WIN_DIMS

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
  constructor(nativeModule) {
    // 若目标模块自带监听器注册表（如 UserApiModule 沙箱），直接桥接过去
    this._module = nativeModule && typeof nativeModule.addListener === 'function' ? nativeModule : null
  }
  addListener(eventType, listener) {
    if (this._module) return this._module.addListener(eventType, listener)
    return { remove() {} }
  }
  removeAllListeners() {
    this._module?.removeAllListeners?.()
  }
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
    // 音源脚本沙箱：浏览器里真跑脚本（否则取歌曲链接永远挂起）
    if (moduleName === 'UserApiModule') return UserApiModule
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
