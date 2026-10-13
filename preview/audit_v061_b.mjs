// v0.6.1 巡检 B：坐标级真实鼠标点击，进入设置/歌单详情/榜单详情/播放页
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
      const onData = (d) => { header += d.toString('latin1'); if (header.includes('\r\n\r\n')) { socket.removeListener('data', onData); res() } }
      socket.on('data', onData)
    })
    return new WS(socket)
  }
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
      this.pending.set(msgId, (msg) => { if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result) })
      const body = Buffer.from(JSON.stringify({ id: msgId, method, params }))
      const mask = crypto.randomBytes(4)
      const masked = Buffer.alloc(body.length)
      for (let i = 0; i < body.length; i++) masked[i] = body[i] ^ mask[i % 4]
      let header
      if (body.length < 126) header = Buffer.from([0x81, 0x80 | body.length])
      else { header = Buffer.alloc(4); header[0] = 0x81; header[1] = 0xfe; header.writeUInt16BE(body.length, 2) }
      this.socket.write(Buffer.concat([header, mask, masked]))
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
  const jsErrors = []
  ws.onEvent = (msg) => {
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails
      jsErrors.push('EXC: ' + ((d.exception?.description || d.text) || '').slice(0, 200))
    }
  }
  await ws.send('Page.enable')
  await ws.send('Runtime.enable')
  await ws.send('Emulation.setDeviceMetricsOverride', { width: 430, height: 900, deviceScaleFactor: 2, mobile: true })
  await ws.send('Page.navigate', { url: PAGE_URL })
  const sleep = (ms) => new Promise(r => setTimeout(r, ms))
  await sleep(8000)

  const evalJs = async (expr) => {
    const r = await ws.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails).slice(0, 400))
    return r.result?.value
  }
  const outDir = path.resolve('preview')
  const shot = async (name) => {
    const r = await ws.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(outDir, name), Buffer.from(r.data, 'base64'))
    console.log('Saved:', name)
  }
  const sig = async (tag) => {
    const s = await evalJs(`(() => {
      const els = [...document.querySelectorAll('div,span')].filter(e => e.offsetParent !== null)
      return els.map(e => e.textContent).join(' ').replace(/\\s+/g,' ').slice(0,120)
    })()`)
    console.log(`[${tag}] ` + s)
  }
  const goto = async (tab) => {
    await evalJs(`(async () => { const m = await import('${SRC}/core/common.ts'); m.setNavActiveId('${tab}') })()`)
    await sleep(1500)
  }
  const clickXY = async (x, y) => {
    for (const type of ['mousePressed', 'mouseReleased']) {
      await ws.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
    }
    await sleep(1800)
  }
  const clickText = async (txt) => {
    const r = await evalJs(`(() => {
      const target = ${JSON.stringify(txt)}
      const els = [...document.querySelectorAll('div,span')].filter(e => {
        if (e.offsetParent === null) return false
        const t = (e.textContent || '').replace(/\\s+/g,'')
        return t.includes(target) && (e.children.length === 0 || t.length < 16)
      })
      const el = els[els.length - 1]
      if (!el) return false
      const rect = el.getBoundingClientRect()
      return [Math.round(rect.x + rect.width / 2), Math.round(rect.y + rect.height / 2)]
    })()`)
    if (!r) return false
    await clickXY(r[0], r[1])
    return true
  }

  // 1 我的 → 齿轮 → 设置主屏
  await goto('nav_love')
  await clickXY(378, 92)
  await shot('v061_08b_setting_main.png')
  await sig('setting')

  // 2 设置 → 关于行
  console.log('关于 row:', await clickText('关于'))
  await sleep(800)
  await shot('v061_09b_about.png')
  await sig('about')

  // 3 歌单广场 → 第一张卡
  await goto('nav_songlist')
  await clickXY(92, 220)
  await shot('v061_04b_songlist_detail.png')
  await sig('songlist_detail')

  // 4 排行榜 → 第一张榜单卡
  await goto('nav_top')
  await sleep(600)
  await clickXY(215, 275)
  await shot('v061_06b_board_detail.png')
  await sig('board_detail')

  // 5 发现页 → 胶囊 → 播放页
  await goto('nav_search')
  await clickXY(215, 789)
  await shot('v061_10b_player.png')
  await sig('player')

  console.log('---- JS ERRORS ----')
  const uniq = [...new Set(jsErrors)]
  console.log(uniq.length ? uniq.slice(0, 15).join('\n') : '(none)')
  console.log('DONE')
  ws.close()
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
