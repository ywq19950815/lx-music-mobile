import http from 'node:http'
import crypto from 'node:crypto'
import net from 'node:net'
import fs from 'node:fs'
import path from 'node:path'

const DEBUG_PORT = 9222
const PAGE_URL = 'http://127.0.0.1:5178'

function httpGetJson(p) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: DEBUG_PORT, path: p }, (res) => {
      let buf = ''
      res.on('data', (d) => { buf += d })
      res.on('end', () => { try { resolve(JSON.parse(buf)) } catch (e) { reject(e) } })
    })
    req.on('error', reject)
    req.end()
  })
}

class WS {
  constructor(socket) {
    this.socket = socket
    this.buffer = Buffer.alloc(0)
    this.pending = new Map()
  }
  static async connect(host, port, p) {
    const key = crypto.randomBytes(16).toString('base64')
    const socket = net.connect(port, host)
    await new Promise((res, rej) => { socket.once('connect', res); socket.once('error', rej) })
    socket.write(`GET ${p} HTTP/1.1\r\nHost: ${host}:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`)
    await new Promise((res, rej) => {
      let header = ''
      const onData = (d) => {
        header += d.toString('latin1')
        if (header.includes('\r\n\r\n')) {
          socket.removeListener('data', onData)
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
      const str = payload.toString('utf8')
      let msg
      try { msg = JSON.parse(str) } catch { continue }
      if (msg.id && this.pending.has(msg.id)) {
        const resolve = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        resolve(msg)
      }
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
  send(method, params = {}) {
    const msgId = ++WS._id
    const payload = { id: msgId, method, params }
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
  if (!page) throw new Error('no page target')

  const u = new URL(page.webSocketDebuggerUrl)
  const ws = await WS.connect('127.0.0.1', DEBUG_PORT, u.pathname + u.search)

  await ws.send('Page.enable')
  await ws.send('Runtime.enable')
  await ws.send('Emulation.setDeviceMetricsOverride', { width: 430, height: 900, deviceScaleFactor: 2, mobile: true })

  const sleep = (ms) => new Promise(r => setTimeout(r, ms))
  const evalJs = async (expr) => {
    const r = await ws.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails).slice(0, 300))
    return r.result?.value
  }

  const outDir = path.resolve('preview')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const shot = async (fileName) => {
    const r = await ws.send('Page.captureScreenshot', { format: 'png' })
    const filePath = path.join(outDir, fileName)
    fs.writeFileSync(filePath, Buffer.from(r.data, 'base64'))
    console.log('Saved:', filePath)
    return filePath
  }

  // 1. 首页现代轻量全景（白底、微透强调、平滑搜索栏）
  await sleep(1000)
  await shot('shot_01_home_modern.png')

  // 2. 模拟点击打开底部播放详情页（黑胶唱机系统）
  await evalJs(`(() => {
    const el = document.querySelector('[data-testid="player-bar-card"]')
    if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })()`)
  await sleep(1500)
  await shot('shot_02_vinyl_player.png')

  // 3. 关闭播放详情页返回首页
  await evalJs(`(async () => {
    try {
      const { navigations } = await import('/@fs/E:/Desktop/AI/lx-music-mobile/src/navigation/navigation.ts')
      navigations.popToRoot('play_detail')
    } catch {}
  })()`)
  await sleep(1000)

  // 4. 打开排行榜 Tab
  await evalJs(`(async () => {
    try {
      const commonState = await import('/@fs/E:/Desktop/AI/lx-music-mobile/src/store/common/state.ts')
      commonState.default.navActiveId = 'nav_top'
    } catch (e) {
      console.error(e)
    }
  })()`)
  await sleep(1500)
  await shot('shot_03_leaderboard.png')

  // 5. 打开我的音乐 Tab
  await evalJs(`(async () => {
    try {
      const commonState = await import('/@fs/E:/Desktop/AI/lx-music-mobile/src/store/common/state.ts')
      commonState.default.navActiveId = 'nav_love'
    } catch (e) {
      console.error(e)
    }
  })()`)
  await sleep(1500)
  await shot('shot_04_mylist.png')

  // 6. 打开设置页
  await evalJs(`(async () => {
    try {
      const commonState = await import('/@fs/E:/Desktop/AI/lx-music-mobile/src/store/common/state.ts')
      commonState.default.navActiveId = 'nav_setting'
    } catch (e) {
      console.error(e)
    }
  })()`)
  await sleep(1500)
  await shot('shot_05_setting.png')

  ws.close()
}

main().catch(console.error)
