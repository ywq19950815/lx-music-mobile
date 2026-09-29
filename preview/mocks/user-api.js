// 预览专用：UserApi 原生模块 mock —— 在浏览器沙箱里真跑 lx 用户音源脚本
// 协议对标 lx-music-desktop（src/main/modules/userApi/renderer/preload.js）：
//   脚本拿到 window.lx 上下文（EVENT_NAMES / request / send / on / utils / env / version）
//   脚本 send('inited')       → 模块发 'api-action' { action:'init', data:{ status, info:{ sources } } }
//   脚本 send('updateAlert')  → { action:'showUpdateAlert', data:{ log, updateUrl? } }
//   App   sendAction('request')  → 调脚本 on('request') 处理器，校验后回 { action:'response', data:{ status, requestKey, result|errorMessage } }
//   脚本 lx.request(url,...)  → App sendAction('response',{requestKey,error,response}) 完成回调
import { Buffer } from 'buffer'
import { aesEncrypt, rsaEncrypt, randomBytes, md5, bufToString, inflate, deflate } from './lx-crypto.js'

const EVENT_NAMES = {
  request: 'request',
  inited: 'inited',
  updateAlert: 'updateAlert',
}

// 与桌面版 preload 相同的白名单（kw/kg/tx/wy/mg + local）
const allSources = ['kw', 'kg', 'tx', 'wy', 'mg', 'local']
const supportQualitys = {
  kw: ['128k', '320k', 'flac', 'flac24bit'],
  kg: ['128k', '320k', 'flac', 'flac24bit'],
  tx: ['128k', '320k', 'flac', 'flac24bit'],
  wy: ['128k', '320k', 'flac', 'flac24bit'],
  mg: ['128k', '320k', 'flac', 'flac24bit'],
  local: [],
}
const supportActions = {
  kw: ['musicUrl'],
  kg: ['musicUrl'],
  tx: ['musicUrl'],
  wy: ['musicUrl'],
  mg: ['musicUrl'],
  local: ['musicUrl', 'lyric', 'pic'],
}

let isInited = false
let requestHandler = null
const pendingRequests = new Map() // requestKey -> abort()
const listeners = new Set()

const emitAction = (action, data) => {
  const event = { action, data: data === undefined ? undefined : JSON.stringify(data) }
  for (const listener of [...listeners]) {
    try { listener(event) } catch (err) { console.warn('[userApi-mock] listener error:', err) }
  }
}

const emitInitError = (errorMessage) => {
  if (isInited) return
  isInited = true
  emitAction('init', { status: false, errorMessage: String(errorMessage ?? 'unknown').slice(0, 1024), info: null })
}

const verifyLyricInfo = (info) => {
  if (typeof info != 'object' || typeof info.lyric != 'string') throw new Error('failed')
  if (info.lyric.length > 51200) throw new Error('failed')
  return {
    lyric: info.lyric,
    tlyric: (typeof info.tlyric == 'string' && info.tlyric.length < 5120) ? info.tlyric : null,
    rlyric: (typeof info.rlyric == 'string' && info.rlyric.length < 5120) ? info.rlyric : null,
    lxlyric: (typeof info.lxlyric == 'string' && info.lxlyric.length < 8192) ? info.lxlyric : null,
  }
}

// ── lx.request：脚本 HTTP 经 App 侧 fetchData 中转 ─────
// 协议（与真机完全一致）：本沙箱发 { action:'request', data:{ requestKey, url, options } }
// → App src/core/init/userApi/index.ts 用 fetchData 真发请求（走 cors-proxy）
// → App sendAction('response', { requestKey, error, response }) 回到这里 → 触发脚本回调
const REQ_TIMEOUT_FALLBACK = 20_000
const lxRequest = (url, options = {}, callback) => {
  const requestKey = `script__${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  const settle = (err, resp) => {
    const target = pendingRequests.get(requestKey)
    if (!target) return
    clearTimeout(target.timer)
    pendingRequests.delete(requestKey)
    try {
      if (err) callback.call(null, err, null, null)
      else callback.call(null, null, resp, resp?.body)
    } catch (e) {
      console.warn('[userApi-mock] script callback error:', e)
    }
  }
  const timer = setTimeout(() => {
    settle(new Error('request timeout'), null)
  }, REQ_TIMEOUT_FALLBACK)
  pendingRequests.set(requestKey, { callback, timer, settle })

  emitAction('request', { requestKey, url, options })
  return () => settle(new Error('request canceled'), null)
}

// ── 脚本请求处理（App sendAction('request') 进来）──────
const handleAppRequest = ({ requestKey, data }) => {
  if (!requestHandler) {
    emitAction('response', { status: false, requestKey, errorMessage: 'Request event is not defined' })
    return
  }
  Promise.resolve().then(() => requestHandler({ source: data.source, action: data.action, info: data.info })).then(response => {
    const sendData = { requestKey }
    switch (data.action) {
      case 'musicUrl':
        if (typeof response != 'string' || response.length > 2048 || !/^https?:/.test(response)) throw new Error('failed')
        sendData.result = {
          source: data.source,
          action: data.action,
          data: { type: data.info.type, url: response },
        }
        break
      case 'lyric':
        sendData.result = {
          source: data.source,
          action: data.action,
          data: verifyLyricInfo(response),
        }
        break
      case 'pic':
        if (typeof response != 'string' || response.length > 2048 || !/^https?:/.test(response)) throw new Error('failed')
        sendData.result = { source: data.source, action: data.action, data: response }
        break
      default:
        sendData.result = { source: data.source, action: data.action, data: response }
        break
    }
    emitAction('response', { status: true, requestKey, result: sendData.result })
  }).catch(err => {
    emitAction('response', { status: false, requestKey, errorMessage: err?.message ?? 'failed' })
  })
}

// ── inited 处理（对标 desktop handleInit）─────────────
const handleInited = (info) => {
  if (!info || typeof info !== 'object') {
    emitInitError('Missing required parameter init info')
    return
  }
  const sourceInfo = { sources: {} }
  try {
    for (const source of allSources) {
      const userSource = info.sources[source]
      if (!userSource || userSource.type !== 'music') continue
      const qualitys = supportQualitys[source]
      const actions = supportActions[source]
      sourceInfo.sources[source] = {
        type: 'music',
        actions: actions.filter(a => userSource.actions.includes(a)),
        qualitys: qualitys.filter(q => userSource.qualitys.includes(q)),
      }
    }
  } catch (error) {
    emitInitError(error.message)
    return
  }
  isInited = true
  emitAction('init', { status: true, info: { sources: sourceInfo.sources } })
}

// ── 构建 lx 上下文（对标 desktop initEnv）─────────────
const buildLxContext = (info) => {
  const lx = {
    EVENT_NAMES,
    request(url, options, callback) {
      // 无回调时返回 Promise（新版音源脚本常见写法），有回调则沿用经典回调式
      if (typeof callback !== 'function') {
        return new Promise((resolve, reject) => {
          lxRequest(url, options || {}, (err, resp) => {
            if (err) reject(err)
            else resolve(resp)
          })
        })
      }
      return lxRequest(url, options || {}, callback)
    },
    send(eventName, data) {
      return new Promise((resolve, reject) => {
        switch (eventName) {
          case EVENT_NAMES.inited:
            if (isInited) return reject(new Error('Script is inited'))
            handleInited(data)
            resolve()
            break
          case EVENT_NAMES.updateAlert: {
            if (!data || typeof data != 'object' || !data.log || typeof data.log != 'string') {
              return reject(new Error('log is required.'))
            }
            const payload = { log: data.log.length > 1024 ? data.log.substring(0, 1024) + '...' : data.log }
            if (data.updateUrl && /^https?:\/\/[^\s$.?#].[^\s]*$/.test(data.updateUrl) && data.updateUrl.length <= 1024) payload.updateUrl = data.updateUrl
            emitAction('showUpdateAlert', payload)
            resolve()
            break
          }
          default:
            reject(new Error('Unknown event name: ' + eventName))
        }
      })
    },
    on(eventName, handler) {
      switch (eventName) {
        case EVENT_NAMES.request:
          requestHandler = handler
          break
        default:
          return Promise.reject(new Error('The event is not supported: ' + eventName))
      }
      return Promise.resolve()
    },
    utils: {
      crypto: {
        aesEncrypt(buffer, mode, key, iv) {
          return aesEncrypt(buffer, mode, key, iv)
        },
        rsaEncrypt(buffer, key) {
          return rsaEncrypt(buffer, key)
        },
        randomBytes(size) {
          return randomBytes(size)
        },
        md5(str) {
          return md5(str)
        },
      },
      buffer: {
        from(...args) {
          return Buffer.from(...args)
        },
        bufToString(buf, format) {
          return bufToString(buf, format)
        },
      },
      zlib: {
        inflate(buf) {
          return inflate(buf)
        },
        deflate(data) {
          return deflate(data)
        },
      },
    },
    currentScriptInfo: {
      name: info.name,
      description: info.description,
      version: info.version,
      author: info.author,
      homepage: info.homepage,
      rawScript: info.script,
    },
    version: '2.0.0',
    env: 'mobile',
  }
  return lx
}

// ── 原生模块接口（RN 侧 NativeModules.UserApiModule）──
const UserApiModule = {
  loadScript(info) {
    try {
      isInited = false
      requestHandler = null
      for (const item of pendingRequests.values()) { try { item.settle(new Error('script reloaded'), null) } catch { /* 忽略 */ } }
      pendingRequests.clear()
      const lx = buildLxContext(info)
      // 脚本通过 globalThis.lx 取上下文（真机是独立 iframe 沙箱）。
      // 这里不能直接覆盖：App 自身也用 global.lx 存全局状态（playerStatus 等）。
      // 用原型链把 App 的 global.lx 挂到沙箱对象下面，脚本能读到 lx.*，
      // App 读写 global.lx 也不会丢。
      const appLx = globalThis.lx
      const sandboxLx = Object.assign(Object.create(appLx ?? Object.prototype), lx)
      globalThis.lx = sandboxLx
      const runner = new Function('lx', 'Buffer', `"use strict";\nreturn (async () => {\n${info.script}\n})()`)
      void Promise.resolve(runner(lx, Buffer)).catch(err => {
        emitInitError(err?.message ?? 'script error')
      })
    } catch (err) {
      emitInitError(err?.message ?? 'script syntax error')
    }
    return Promise.resolve()
  },
  sendAction(action, data) {
    try {
      const payload = typeof data === 'string' ? JSON.parse(data) : data
      switch (action) {
        case 'request':
          handleAppRequest(payload)
          break
        case 'response': {
          const target = pendingRequests.get(payload?.requestKey)
          if (!target) break
          if (payload.error) target.settle(new Error(payload.error), null)
          else target.settle(null, payload.response ?? null)
          break
        }
        case 'cancelRequest': {
          const target = pendingRequests.get(payload)
          if (target) target.settle(new Error('request canceled'), null)
          break
        }
        default:
          break
      }
      return Promise.resolve()
    } catch (err) {
      console.warn('[userApi-mock] sendAction error:', err)
      return Promise.resolve()
    }
  },
  destroy() {
    isInited = false
    requestHandler = null
    for (const abort of pendingRequests.values()) { try { abort() } catch { /* 忽略 */ } }
    pendingRequests.clear()
    return Promise.resolve()
  },
  // NativeEventEmitter 桥（App 侧 onScriptAction 订阅 'api-action'）
  addListener(_eventType, listener) {
    listeners.add(listener)
    return { remove() { listeners.delete(listener) } }
  },
  removeAllListeners() { listeners.clear() },
}

// 未捕获异常兜底（对标 desktop 的 __lx_init_error_handler__）
if (!globalThis.__lxUserApiErrHooked) {
  globalThis.__lxUserApiErrHooked = true
  globalThis.addEventListener?.('unhandledrejection', (event) => {
    const reason = event?.reason
    if (!event.isTrusted && reason) {
      emitInitError(typeof reason === 'string' ? reason : (reason.message ?? String(reason)))
    }
  })
  globalThis.addEventListener?.('error', (event) => {
    if (event.isTrusted && event.message) {
      emitInitError(String(event.message).replace(/^Uncaught\sError:\s/, ''))
    }
  })
}

export default UserApiModule
