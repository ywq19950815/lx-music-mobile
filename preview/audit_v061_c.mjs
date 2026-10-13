// v0.6.1 修复后复检：设置/关于/歌单详情/榜单详情/播放页
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
    req.on('error', reject); req.end()
  })
}
class WS {
  constructor(socket) { this.socket = socket; this.buffer = Buffer.alloc(0); this.pending = new Map() }
  static async connect(host, port, p) {
    const key = crypto.randomBytes(16).toString('base64')
    const socket = net.connect(port, host)
    await new Promise((res, rej) => { socket.once('connect', res); socket.once('error', rej) })
    socket.write(`GET ${p} HTTP/1.1\r\nHost: ${host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`)
    await new Promise((res, rej) => { let h=''; const on=(d)=>{h+=d.toString('latin1'); if(h.includes('\r\n\r\n')){socket.removeListener('data',on);res()}}; socket.on('data',on) })
    return new WS(socket)
  }
  start() {
    this.socket.on('data', (d) => {
      this.buffer = Buffer.concat([this.buffer, d])
      while (this.buffer.length >= 2) {
        const b0=this.buffer[0],b1=this.buffer[1]; let len=b1&0x7f,off=2
        if(len===126){len=this.buffer.readUInt16BE(2);off=4} else if(len===127){len=Number(this.buffer.readBigUInt64BE(2));off=10}
        if(this.buffer.length<off+len)break
        const payload=this.buffer.subarray(off,off+len); this.buffer=this.buffer.subarray(off+len)
        if((b0&0x80)&&(b0&0x0f)===1){ try{const m=JSON.parse(payload.toString('utf8')); if(m.id&&this.pending.has(m.id)){this.pending.get(m.id)(m);this.pending.delete(m.id)}}catch{} }
      }
    })
  }
  send(method, params = {}) {
    const id = ++WS._id
    return new Promise((resolve, reject) => {
      this.pending.set(id, (m) => { m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result) })
      const body = Buffer.from(JSON.stringify({ id, method, params }))
      const mask = crypto.randomBytes(4); const mk = Buffer.alloc(body.length)
      for (let i = 0; i < body.length; i++) mk[i] = body[i] ^ mask[i % 4]
      let h; if (body.length < 126) h = Buffer.from([0x81, 0x80 | body.length]); else { h = Buffer.alloc(4); h[0]=0x81; h[1]=0xfe; h.writeUInt16BE(body.length,2) }
      this.socket.write(Buffer.concat([h, mask, mk]))
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('timeout ' + method)) } }, 30000)
    })
  }
  close(){try{this.socket.destroy()}catch{}}
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
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails).slice(0, 300))
    return r.result?.value
  }
  const outDir = path.resolve('preview')
  const shot = async (name) => {
    const r = await ws.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(outDir, name), Buffer.from(r.data, 'base64'))
    console.log('Saved:', name)
  }
  const goto = async (tab) => {
    await evalJs(`(async () => { const m = await import('${SRC}/core/common.ts'); m.setNavActiveId('${tab}') })()`)
    await sleep(1500)
  }
  const click = async (x, y) => {
    for (const type of ['mousePressed', 'mouseReleased']) {
      await ws.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
    }
    await sleep(1800)
  }
  const clickTextXY = async (txt) => {
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
    await click(r[0], r[1])
    return true
  }

  // 1 设置主屏
  await goto('nav_love')
  await click(378, 92)
  await shot('v061_fix_01_setting.png')

  // 2 关于
  console.log('关于:', await clickTextXY('关于与更新'))
  await sleep(600)
  await shot('v061_fix_02_about.png')

  // 3 歌单详情
  await goto('nav_songlist')
  await click(92, 220)
  await shot('v061_fix_03_songlist_detail.png')
  // 返回
  await click(51, 72)

  // 4 榜单详情
  await goto('nav_top')
  await sleep(600)
  await click(215, 275)
  await shot('v061_fix_04_board_detail.png')
  await click(51, 72)

  // 5 播放页
  await goto('nav_search')
  await click(215, 789)
  await shot('v061_fix_05_player.png')

  console.log('---- JS ERRORS ----')
  const uniq = [...new Set(jsErrors)]
  console.log(uniq.length ? uniq.slice(0, 15).join('\n') : '(none)')
  console.log('DONE')
  ws.close()
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
