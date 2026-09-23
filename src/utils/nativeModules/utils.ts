import { AppState, NativeEventEmitter, NativeModules } from 'react-native'

const { UtilsModule } = NativeModules

export const exitApp = UtilsModule.exitApp

export const getSupportedAbis = UtilsModule.getSupportedAbis

export const installApk = (filePath: string, fileProviderAuthority: string) => UtilsModule.installApk(filePath, fileProviderAuthority)


export const screenkeepAwake = () => {
  if (global.lx.isScreenKeepAwake) return
  global.lx.isScreenKeepAwake = true
  UtilsModule.screenkeepAwake()
}
export const screenUnkeepAwake = () => {
  // console.log('screenUnkeepAwake')
  if (!global.lx.isScreenKeepAwake) return
  global.lx.isScreenKeepAwake = false
  UtilsModule.screenUnkeepAwake()
}

export const getWIFIIPV4Address = UtilsModule.getWIFIIPV4Address as () => Promise<string>

export const getDeviceName = async(): Promise<string> => {
  return UtilsModule.getDeviceName().then((deviceName: string) => deviceName || 'Unknown')
}

export const isNotificationsEnabled = UtilsModule.isNotificationsEnabled as () => Promise<boolean>

export const requestNotificationPermission = async() => new Promise<boolean>((resolve) => {
  let subscription = AppState.addEventListener('change', (state) => {
    if (state != 'active') return
    subscription.remove()
    setTimeout(() => {
      void isNotificationsEnabled().then(resolve)
    }, 1000)
  })
  UtilsModule.openNotificationPermissionActivity().then((result: boolean) => {
    if (result) return
    subscription.remove()
    resolve(false)
  })
})

export const getSystemLocales = async(): Promise<string> => {
  return UtilsModule.getSystemLocales()
}

export const onScreenStateChange = (handler: (state: 'ON' | 'OFF') => void): () => void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const eventEmitter = new NativeEventEmitter(UtilsModule)
  const eventListener = eventEmitter.addListener('screen-state', event => {
    handler(event.state as 'ON' | 'OFF')
  })

  return () => {
    eventListener.remove()
  }
}

export const getWindowSize = async(): Promise<{ width: number, height: number }> => {
  return UtilsModule.getWindowSize()
}

export interface SystemBarsInsets {
  /** 状态栏高度（dp） */
  statusBarHeight: number
  /** 底部导航栏 / 手势条（小白条）高度（dp） */
  navigationBarHeight: number
}

/**
 * 打开沉浸式系统栏（状态栏 + 底部手势条），并返回两条系统栏的实际高度。
 *
 * 背景：react-native-navigation 在应用页面 options 时会把窗口拉回
 * 「非沉浸」（setDecorFitsSystemWindows(true)），且它的 navigationBar 选项没有
 * drawBehind，无法从 JS 打开 edge-to-edge。所以只能由原生侧在 RNN 之后抢回来。
 * 详见 android/.../utils/SystemBars.java。
 *
 * Web 预览（react-native-web）下该原生方法不存在，会走到 catch 返回 0，
 * 由 preview/mocks 里的模拟值兜底。
 *
 * @param darkIcons true = 系统栏图标用深色（浅色界面）
 */
export const setImmersiveSystemBars = async(darkIcons: boolean): Promise<SystemBarsInsets> => {
  const fallback: SystemBarsInsets = { statusBarHeight: 0, navigationBarHeight: 0 }
  try {
    const res = await UtilsModule.setImmersiveSystemBars(darkIcons) as SystemBarsInsets | null | undefined
    if (res == null) return fallback
    const statusBarHeight = Number(res.statusBarHeight)
    const navigationBarHeight = Number(res.navigationBarHeight)
    return {
      statusBarHeight: Number.isFinite(statusBarHeight) && statusBarHeight > 0 ? statusBarHeight : 0,
      navigationBarHeight: Number.isFinite(navigationBarHeight) && navigationBarHeight > 0 ? navigationBarHeight : 0,
    }
  } catch (err) {
    // 非 Android 环境（Web 预览 / 单元测试）直接忽略
    return fallback
  }
}

export const onWindowSizeChange = (handler: (size: { width: number, height: number }) => void): () => void => {
  UtilsModule.listenWindowSizeChanged()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const eventEmitter = new NativeEventEmitter(UtilsModule)
  const eventListener = eventEmitter.addListener('screen-size-changed', event => {
    handler(event as { width: number, height: number })
  })

  return () => {
    eventListener.remove()
  }
}

export const isIgnoringBatteryOptimization = async(): Promise<boolean> => {
  return UtilsModule.isIgnoringBatteryOptimization()
}

export const requestIgnoreBatteryOptimization = async() => new Promise<boolean>((resolve) => {
  let subscription = AppState.addEventListener('change', (state) => {
    if (state != 'active') return
    subscription.remove()
    setTimeout(() => {
      void isIgnoringBatteryOptimization().then(resolve)
    }, 1000)
  })
  UtilsModule.requestIgnoreBatteryOptimization().then((result: boolean) => {
    if (result) return
    subscription.remove()
    resolve(false)
  })
})
