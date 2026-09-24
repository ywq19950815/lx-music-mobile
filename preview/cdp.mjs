// 零依赖 CDP 客户端 + 截图验证脚本
import http from 'node:http'
import crypto from 'node:crypto'
import net from 'node:net'
import fs from 'node:fs'

const DEBUG_PORT = 9222
const PAGE_URL = 'http://127.0.0.1:5178'

function httpGetJson(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: DEBUG_PORT, path, method }, (res) => {
      let buf = ''
      res.on('data', (d) => { buf += d })
      res.on('end', () => { try { resolve(JSON.parse(buf)) } catch (e) { reject(new Error(buf.slice(0, 200))) } })
    })
    req.on('error', reject)
    req.end()
  })
}

class WS {
  constructor(socket) {
    this.socket = socket
    this.buffer = Buffer.alloc(0)
    this.waiters = []
    this.pending = new Map() // id -> resolve
    this.events = []
  }
  static async connect(host, port, path) {
    const key = crypto.randomBytes(16).toString('base64')
    const socket = net.connect(port, host)
    await new Promise((res, rej) => { socket.once('connect', res); socket.once('error', rej) })
    socket.write(`GET ${path} HTTP/1.1\r\nHost: ${host}:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`)
    await new Promise((res, rej) => {
      let header = ''
      const onData = (d) => {
        header += d.toString('latin1')
        if (header.includes('\r\n\r\n')) {
          socket.removeListener('data', onData)
          if (!/Sec-WebSocket-Accept:/i.test(header)) return rej(new Error('WS handshake failed: ' + header.slice(0, 200)))
          res()
        }
      }
      socket.on('data', onData)
      socket.once('error', rej)
    })
    const ws = new WS(socket)
    socket.on('data', (d) => ws._onData(d))
    return ws
  }
  _onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk])
    for (;;) {
      if (this.buffer.length < 2) return
      const opcode = this.buffer[0] & 0x0f
      const len0 = this.buffer[1] & 0x7f
      const masked = (this.buffer[1] & 0x80) !== 0
      let offset = 2
      let len = len0
      if (len0 === 126) { if (this.buffer.length < 4) return; len = this.buffer.readUInt16BE(2); offset = 4 }
      else if (len0 === 127) { if (this.buffer.length < 10) return; len = Number(this.buffer.readBigUInt64BE(2)); offset = 10 }
      if (this.buffer.length < offset + len) return
      let payload = Buffer.from(this.buffer.subarray(offset + (masked ? 4 : 0), offset + len))
      if (masked) {
        const mask = Buffer.from(this.buffer.subarray(offset, offset + 4))
        for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4]
      }
      this.buffer = this.buffer.subarray(offset + len)
      if (opcode === 0x9) { this._sendRaw(payload, 0xA); continue }
      if (opcode === 0x8) continue
      const str = payload.toString('utf8')
      let msg
      try { msg = JSON.parse(str) } catch { continue }
      this._dispatch(msg)
    }
  }
  _dispatch(msg) {
    if (msg.id && this.pending.has(msg.id)) {
      const resolve = this.pending.get(msg.id)
      this.pending.delete(msg.id)
      resolve(msg)
    } else {
      this.events.push(msg)
      if (this.onEvent) this.onEvent(msg)
    }
  }
  _sendRaw(buf, opcode) {
    const mask = crypto.randomBytes(4)
    const masked = Buffer.from(buf)
    for (let i = 0; i < masked.length; i++) masked[i] ^= mask[i % 4]
    let header
    if (buf.length < 126) header = Buffer.from([0x80 | opcode, 0x80 | buf.length])
    else if (buf.length < 65536) header = Buffer.alloc(4)
    else header = Buffer.alloc(10)
    if (buf.length >= 126) {
      if (buf.length < 65536) { header[0] = 0x80 | opcode; header[1] = 0x80 | 126; header.writeUInt16BE(buf.length, 2) }
      else { header[0] = 0x80 | opcode; header[1] = 0x80 | 127; header.writeBigUInt64BE(BigInt(buf.length), 2) }
    }
    this.socket.write(Buffer.concat([header, mask, masked]))
  }
  send(method, params = {}, sessionId) {
    const msgId = ++WS._id
    const payload = { id: msgId, method, params }
    if (sessionId) payload.sessionId = sessionId
    return new Promise((resolve, reject) => {
      this.pending.set(msgId, (msg) => {
        if (msg.error) reject(new Error(JSON.stringify(msg.error)))
        else resolve(msg.result)
      })
      this._sendRaw(Buffer.from(JSON.stringify(payload)), 0x1)
      setTimeout(() => {
        if (this.pending.has(msgId)) {
          this.pending.delete(msgId)
          reject(new Error(`CDP timeout: ${method}`))
        }
      }, 30000)
    })
  }
  close() { try { this.socket.destroy() } catch {} }
}
WS._id = 0

async function main() {
  const targets = await httpGetJson('/json/list')
  const page = targets.find(t => t.type === 'page')
  if (!page) throw new Error('no page target; is Chrome running with --remote-debugging-port?')

  const u = new URL(page.webSocketDebuggerUrl)
  const ws = await WS.connect('127.0.0.1', DEBUG_PORT, u.pathname + u.search)

  const consoleErrors = []
  const allLogs = []
  ws.onEvent = (msg) => {
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300)
      allLogs.push(`[${msg.params.type}] ${text}`)
      if (msg.params.type === 'error') consoleErrors.push(text)
    } else if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(String(msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text ?? 'exception').slice(0, 400))
    }
  }

  await ws.send('Page.enable')
  await ws.send('Runtime.enable')
  await ws.send('Emulation.setDeviceMetricsOverride', { width: 430, height: 900, deviceScaleFactor: 2, mobile: true })
  await ws.send('Page.navigate', { url: PAGE_URL })
  const sleep = (ms) => new Promise(r => setTimeout(r, ms))
  await sleep(10000)

  const evalJs = async (expr) => {
    const r = await ws.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails).slice(0, 300))
    return r.result?.value
  }
  const shot = async (name) => {
    const r = await ws.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(name, Buffer.from(r.data, 'base64'))
    console.log('saved', name)
  }

  // 1. 首页
  const bodyText = await evalJs(`document.body.innerText.replace(/\\n+/g, ' | ').slice(0, 600)`)
  const sizeDebug = await evalJs(`(async () => {
    const wt = await import('/@fs/E:/Desktop/AI/lx-music-mobile/src/utils/windowSizeTools.ts?t=' + Date.now())
    const rn = await import('/@fs/E:/Desktop/AI/lx-music-mobile/preview/mocks/rn.js')
    const dims = rn.Dimensions.get('window')
    return JSON.stringify({
      size: wt.windowSizeTools.getSize(),
      dims: { w: dims.width, h: dims.height, scale: dims.scale },
      fontScale: rn.PixelRatio.getFontScale(),
      pr: rn.PixelRatio.get(),
      lxFontSize: globalThis.lx && globalThis.lx.fontSize,
    })
  })()`)
  console.log('SIZE:', sizeDebug)
  const domDebug = await evalJs(`(() => {
    const root = document.getElementById('root')
    return JSON.stringify({
      rootChildren: root ? root.children.length : -1,
      rootHtmlHead: root ? root.innerHTML.replace(/\\s+/g, ' ').slice(0, 300) : 'no-root',
      scripts: document.scripts.length,
      readyState: document.readyState,
      darkScheme: window.matchMedia('(prefers-color-scheme: dark)').matches,
    })
  })()`)
  console.log('DOM:', domDebug)
  await sleep(1500)
  await shot('shot_home.png')

  // 2. 打开播放页（点迷你条）
  const clicked = await evalJs(`(() => {
    const el = document.querySelector('[data-testid="player-bar-card"]')
    if (!el) return 'no-player-bar'
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    return 'clicked'
  })()`)
  await sleep(2500)
  await shot('shot_playdetail.png')

  // 3. 触发播放状态（测试唱针落盘与旋转）
  const playTriggered = await evalJs(`(async () => {
    try {
      const ps = await import('/@fs/E:/Desktop/AI/lx-music-mobile/src/core/player/playStatus.ts')
      ps.setIsPlay(true)
      return 'played'
    } catch (e) {
      return 'err: ' + e.message
    }
  })()`)
  console.log('PLAY_TRIGGERED:', playTriggered)
  await sleep(1500)
  await shot('shot_playing.png')

  console.log(JSON.stringify({ bodyText, clicked, playTriggered, consoleErrors: consoleErrors.slice(0, 12), lastLogs: allLogs.slice(-25) }, null, 2))
  ws.close()
}

main().catch(e => { console.error('VERIFY FAILED:', e.message || e); process.exit(1) })
