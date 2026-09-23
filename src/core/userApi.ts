import { action, state } from '@/store/userApi'
import { addUserApi, getUserApiList, getUserApiScript, removeUserApi as removeUserApiFromStore, setUserApiAllowShowUpdateAlert as setUserApiAllowShowUpdateAlertFromStore } from '@/utils/data'
import { destroy, loadScript } from '@/utils/nativeModules/userApi'
import { log as writeLog } from '@/utils/log'

/**
 * 音源初始化超时兜底。
 *
 * 正常流程：setUserApi() 把状态置为 initing → 原生 UserApiModule.loadScript()
 * → 原生侧初始化完成后通过 'api-action'('init') 事件回调 handleStateChange → 状态落定。
 *
 * 但如果原生模块**始终没有回调**（脚本抛异常被吞、原生侧崩溃、mock 环境没有实现），
 * 状态就永远停在 initing，UI 上一直显示「初始化中」，且因为 store 初始值就是
 * { status: false, message: 'initing' }，表现为「一进来就卡在初始化中」。
 *
 * 这里加一个超时闸门：超过 USER_API_INIT_TIMEOUT 仍未落定，就按失败处理，
 * 让 UI 能给出可操作的反馈（而不是无限转圈）。
 */
const USER_API_INIT_TIMEOUT = 15_000
let initTimeoutTimer: ReturnType<typeof setTimeout> | null = null

const clearInitTimeout = () => {
  if (initTimeoutTimer != null) {
    clearTimeout(initTimeoutTimer)
    initTimeoutTimer = null
  }
}

export const setUserApi = async(apiId: string) => {
  global.lx.qualityList = {}
  setUserApiStatus(false, 'initing')

  const target = state.list.find(api => api.id === apiId)
  if (!target) {
    setUserApiStatus(false, 'not_found')
    throw new Error('api not found')
  }

  // 启动超时闸门；若原生侧正常回调，handleStateChange 会调 setUserApiStatus 落定状态，
  // 这里再清掉计时器（见下方 clearInitTimeout 的导出）。
  clearInitTimeout()
  initTimeoutTimer = setTimeout(() => {
    initTimeoutTimer = null
    // 只有还停在 initing 才判定超时，避免覆盖已经落定的成功/失败状态
    if (state.status.status === false && state.status.message === 'initing') {
      writeLog.warn(`[userApi] 音源初始化超时（${USER_API_INIT_TIMEOUT}ms 未回调）: ${target.name}`)
      setUserApiStatus(false, 'init_timeout')
    }
  }, USER_API_INIT_TIMEOUT)

  const script = await getUserApiScript(target.id)
  loadScript({ ...target, script })
}

/** 状态落定后由 handleStateChange 调用，清掉超时闸门。 */
export const markUserApiInitSettled = () => {
  clearInitTimeout()
}

export const destroyUserApi = () => {
  destroy()
}


export const setUserApiStatus: typeof action['setStatus'] = (status, message) => {
  action.setStatus(status, message)
}

export const setUserApiList: typeof action['setUserApiList'] = (list) => {
  action.setUserApiList(list)
}

export const importUserApi = async(script: string) => {
  const info = await addUserApi(script)
  action.addUserApi(info)
}

export const removeUserApi = async(ids: string[]) => {
  const list = await removeUserApiFromStore(ids)
  action.setUserApiList(list)
}

export const setUserApiAllowShowUpdateAlert = async(id: string, enable: boolean) => {
  await setUserApiAllowShowUpdateAlertFromStore(id, enable)
  action.setUserApiAllowShowUpdateAlert(id, enable)
}

/**
 * 从本地存储重新读取音源列表并同步到 store。
 * 用于「安装内置音源」等绕过 importUserApi 的落盘操作后刷新 UI。
 */
export const refreshUserApiList = async() => {
  const list = await getUserApiList()
  action.setUserApiList(list)
  return list
}

export const log = {
  r_info(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    writeLog.info(...params)
  },
  r_warn(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    writeLog.warn(...params)
  },
  r_error(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    writeLog.error(...params)
  },
  log(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (global.lx.isEnableUserApiLog) writeLog.info(...params)
  },
  info(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (global.lx.isEnableUserApiLog) writeLog.info(...params)
  },
  warn(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (global.lx.isEnableUserApiLog) writeLog.warn(...params)
  },
  error(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (global.lx.isEnableUserApiLog) writeLog.error(...params)
  },
}
