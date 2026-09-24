import React from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'

// ── 环境垫片 ──────────────────────────────
globalThis.Buffer = Buffer
if (!globalThis.setImmediate) {
  globalThis.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args)
}
if (!globalThis.clearImmediate) {
  globalThis.clearImmediate = (id) => clearTimeout(id)
}

// global.lx 提前初始化，避免模块加载顺序导致 undefined（正式由 src/config/globalData.ts 覆盖）
globalThis.global = globalThis
globalThis.process = globalThis.process || { env: { NODE_ENV: 'development' } }
globalThis.process.versions = globalThis.process.versions || { app: '0.1.0' }
globalThis.lx = globalThis.lx || {
  fontSize: 1,
  playerStatus: { isInitialized: false, isRegisteredService: false, isIniting: false },
  env: 'web',
  isPlaying: false,
  isShowPlayerComment: false,
}

// 确保预览环境始终以简体中文展示（防历史 localStorage 旧 setting 污染）
try {
  const settingStr = localStorage.getItem('@setting_v1')
  if (settingStr) {
    const settingObj = JSON.parse(settingStr)
    if (settingObj['common.langId'] !== 'zh_cn') {
      settingObj['common.langId'] = 'zh_cn'
      localStorage.setItem('@setting_v1', JSON.stringify(settingObj))
    }
  }
} catch (e) {}

window.addEventListener('unhandledrejection', (e) => {
  console.error('[unhandledRejection]', String(e.reason?.stack || e.reason).slice(0, 500))
})
window.addEventListener('error', (e) => {
  console.error('[windowError]', String(e.error?.stack || e.message).slice(0, 500))
})

// ── 挂载 RNN mock 渲染树（先挂载，再跑 app 引导）──────────
import { RNNTree } from './mocks/rnn.jsx'

// 首帧渲染后再启动 app（appLaunched 由 RNNTree 首帧触发）
const root = createRoot(document.getElementById('root'))
root.render(<RNNTree />)

// 动态导入 app 入口（内部 async 引导）
import('../src/app').catch((err) => {
  console.error('[preview] app boot failed:', err)
  document.getElementById('root').innerHTML = `<pre style="color:#f66;padding:12px;white-space:pre-wrap">${String(err.stack || err)}</pre>`
})
