// 定制截图：通过 App 自身的 action 切页，逐个截取关键页面
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
    })
    return new WS(socket)
  }
  _sendRaw(buf, opcode) { this.socket.write(buf) }
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
            if (msg.id && this.pending.has(msg.id)) {
              this.pending.get(msg.id)(msg)
              this.pending.delete(msg.id)
            } else if (msg.method) this.onEvent(msg)
          } catch {}
        }
      }
    })
  }
  send(method, params = {}) {
    const msgId = ++WS._id
    const payload = { id: msgId, method, params }
    return new Promise((resolve, reject) => {
      this.pending.set(msgId, (msg) => {
        if (msg.error) reject(new Error(JSON.stringify(msg.error)))
        else resolve(msg.result)
      })
      const body = Buffer.from(JSON.stringify(payload))
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
  if (!page) throw new Error('no page target')
  const u = new URL(page.webSocketDebuggerUrl)
  const ws = await WS.connect('127.0.0.1', DEBUG_PORT, u.pathname + u.search)
  ws.start()

  await ws.send('Page.enable')
  await ws.send('Runtime.enable')
  await ws.send('Emulation.setDeviceMetricsOverride', { width: 430, height: 900, deviceScaleFactor: 2, mobile: true })
  await ws.send('Page.navigate', { url: PAGE_URL })
  const sleep = (ms) => new Promise(r => setTimeout(r, ms))
  await sleep(7000)

  const evalJs = async (expr) => {
    const r = await ws.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails).slice(0, 300))
    return r.result?.value
  }

  const outDir = path.resolve('preview')
  const shot = async (name) => {
    const r = await ws.send('Page.captureScreenshot', { format: 'png' })
    const filePath = path.join(outDir, name)
    fs.writeFileSync(filePath, Buffer.from(r.data, 'base64'))
    console.log('Saved:', name)
  }

  const goto = async (tab) => {
    await evalJs(`(async () => {
      const m = await import('${SRC}/core/common.ts')
      m.setNavActiveId('${tab}')
    })()`)
    await sleep(1400)
  }

  await goto('nav_search')
  await shot('v060_01_discover.png')

  await goto('nav_songlist')
  await shot('v060_02_songlist.png')

  await goto('nav_top')
  await sleep(1600)
  await shot('v060_03_leaderboard.png')

  await goto('nav_love')
  await shot('v060_04_mylist.png')

  // 我的页 → 设置（二级）
  await evalJs(`(() => {
    const btns = [...document.querySelectorAll('div,span')]
    const el = btns.find(e => e.textContent === '设置' && e.children.length === 0)
    if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })()`)
  await sleep(1400)
  await shot('v060_05_setting.png')

  // 播放页：点击底部胶囊
  await goto('nav_search')
  await evalJs(`(() => {
    const el = document.querySelector('[data-testid="tabbar-toggle"]')
    const card = el ? el.closest('div[style*="border-radius"]') : null
    const target = document.querySelectorAll('div')
    // 点击胶囊主体：找包含“暂无播放歌曲/歌手信息”的可点区域
    const cands = [...document.querySelectorAll('div')].filter(d => {
      const s = d.getAttribute('style') || ''
      return s.includes('border-radius: 26px') || s.includes('border-radius:26px')
    })
    ;(cands[0] || target[0]).dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })()`)
  await sleep(1800)
  await shot('v060_06_player.png')

  console.log('DONE')
  ws.close()
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
