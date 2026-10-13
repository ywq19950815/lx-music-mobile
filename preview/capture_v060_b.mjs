// 用真实鼠标点击截取设置页（齿轮在右上角）
import http from 'node:http'
import crypto from 'node:crypto'
import net from 'node:net'
import fs from 'node:fs'
import path from 'node:path'

const DEBUG_PORT = 9222
const PAGE_URL = 'http://127.0.0.1:5178'
const SRC = '/@fs/E:/Desktop/AI/lx-music-mobile/src'

function httpGetJson(p) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: DEBUG_PORT, path: p, method: 'GET' }, (res) => {
      let buf = ''
      res.on('data', (d) => { buf += d })
      res.on('end', () => { try { resolve(JSON.parse(buf)) } catch (e) { reject(new Error(buf.slice(0, 200))) } })
    })
    req.on('error', reject)
    req.end()
  })
}

class WS {
  constructor(socket) { this.socket = socket; this.buffer = Buffer.alloc(0); this.pending = new Map() }
  static async connect(host, port, p) {
    const key = crypto.randomBytes(16).toString('base64')
    const socket = net.connect(port, host)
    await new Promise((res, rej) => { socket.once('connect', res); socket.once('error', rej) })
    socket.write(`GET ${p} HTTP/1.1\r\nHost: ${host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`)
    await new Promise((res) => {
      let header = ''
      const onData = (d) => {
        header += d.toString('latin1')
        if (header.includes('\r\n\r\n')) { socket.removeListener('data', onData); res() }
      }
      socket.on('data', onData)
    })
    return new WS(socket)
  }
  _sendRaw(buf) { this.socket.write(buf) }
  onEvent = () => {}
  start() {
    this.socket.on('data', (d) => {
      this.buffer = Buffer.concat([this.buffer, d])
      while (this.buffer.length >= 2) {
        const b0 = this.buffer[0], b1 = this.buffer[1]
        const fin = (b0 & 0x80) !== 0, opcode = b0 & 0x0f
        let len = b1 & 0x7f, off = 2
        if (len === 126) { len = this.buffer.readUInt16BE(2); off = 4 }
        else if (len === 127) { len = Number(this.buffer.readBigUInt64BE(2)); off = 10 }
        if (this.buffer.length < off + len) break
        const payload = this.buffer.subarray(off, off + len)
        this.buffer = this.buffer.subarray(off + len)
        if (opcode === 0x1 && fin) {
          try {
            const msg = JSON.parse(payload.toString('utf8'))
            if (msg.id && this.pending.has(msg.id)) { this.pending.get(msg.id)(msg); this.pending.delete(msg.id) }
            else if (msg.method) this.onEvent(msg)
          } catch {}
        }
      }
    })
  }
  send(method, params = {}) {
    const msgId = ++WS._id
    return new Promise((resolve, reject) => {
      this.pending.set(msgId, (msg) => {
        if (msg.error) reject(new Error(JSON.stringify(msg.error)))
        else resolve(msg.result)
      })
      const body = Buffer.from(JSON.stringify({ id: msgId, method, params }))
      const mask = crypto.randomBytes(4)
      const masked = Buffer.alloc(body.length)
      for (let i = 0; i < body.length; i++) masked[i] = body[i] ^ mask[i % 4]
      let header
      if (body.length < 126) header = Buffer.from([0x81, 0x80 | body.length])
      else { header = Buffer.alloc(4); header[0] = 0x81; header[1] = 0xfe; header.writeUInt16BE(body.length, 2) }
      this._sendRaw(Buffer.concat([header, mask, masked]))
      setTimeout(() => { if (this.pending.has(msgId)) { this.pending.delete(msgId); reject(new Error('CDP timeout: ' + method)) } }, 30000)
    })
  }
  close() { try { this.socket.destroy() } catch {} }
}
WS._id = 0

async function main() {
  const targets = await httpGetJson('/json/list')
  const page = targets.find(t => t.type === 'page')
  const u = new URL(page.webSocketDebuggerUrl)
  const ws = await WS.connect('127.0.0.1', DEBUG_PORT, u.pathname + u.search)
  ws.start()
  const sleep = (ms) => new Promise(r => setTimeout(r, ms))

  await ws.send('Page.enable')
  await ws.send('Runtime.enable')
  await ws.send('Emulation.setDeviceMetricsOverride', { width: 430, height: 900, deviceScaleFactor: 2, mobile: true })
  await ws.send('Page.navigate', { url: PAGE_URL })
  await sleep(7000)

  const evalJs = async (expr) => {
    const r = await ws.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
    return r.result?.value
  }
  const click = async (x, y) => {
    await ws.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
    await ws.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
  }
  const shot = async (name) => {
    const r = await ws.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.resolve('preview', name), Buffer.from(r.data, 'base64'))
    console.log('Saved:', name)
  }

  // 去「我的」tab
  await evalJs(`(async () => { const m = await import('${SRC}/core/common.ts'); m.setNavActiveId('nav_love') })()`)
  await sleep(1500)
  // 点右上角齿轮（MY MUSIC PROFILE 行右侧）
  await click(398, 76)
  await sleep(1600)
  await shot('v060_05_setting.png')

  // 设置页里点「关于与更新」看 Dialog 上滑动效（静态截图看结构）
  await evalJs(`(() => {
    const els = [...document.querySelectorAll('div,span')]
    const el = els.find(e => e.textContent === '关于与更新' && e.children.length === 0)
    if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })()`)
  await sleep(1500)
  await shot('v060_07_about.png')

  console.log('DONE')
  ws.close()
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
