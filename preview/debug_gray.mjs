// 调试：进入设置页后取灰色区域的元素栈与背景色
import http from 'node:http'
import crypto from 'node:crypto'
import net from 'node:net'

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
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('timeout ' + method)) } }, 20000)
    })
  }
  close(){try{this.socket.destroy()}catch{}}
}
WS._id = 0

const targets = await httpGetJson('/json/list')
const page = targets.find(t => t.type === 'page')
const u = new URL(page.webSocketDebuggerUrl)
const ws = await WS.connect('127.0.0.1', DEBUG_PORT, u.pathname + u.search)
ws.start()
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
// 回主页（pop 所有 push 页）
await evalJs(`(async () => {
  const m = await import('${SRC}/core/common.ts')
  m.setNavActiveId('nav_love')
})()`)
await sleep(1500)
// 点齿轮进设置
for (const type of ['mousePressed', 'mouseReleased']) {
  await ws.send('Input.dispatchMouseEvent', { type, x: 378, y: 92, button: 'left', clickCount: 1 })
}
await sleep(1500)

const r = await evalJs(`(() => {
  const pts = [[215, 400], [215, 700], [215, 830], [215, 120]]
  return JSON.stringify(pts.map(([x, y]) => {
    const els = document.elementsFromPoint(x, y).slice(0, 10)
    return { point: [x, y], stack: els.map(e => {
      const cs = getComputedStyle(e)
      const rc = e.getBoundingClientRect()
      return { tag: e.tagName, bg: cs.backgroundColor, pe: cs.pointerEvents, op: cs.opacity, txt: (e.textContent||'').replace(/\\s+/g,' ').slice(0,12), rect: [Math.round(rc.x), Math.round(rc.y), Math.round(rc.width), Math.round(rc.height)] }
    }) }
  }))
})()`, )
console.log(r)
ws.close()
process.exit(0)
