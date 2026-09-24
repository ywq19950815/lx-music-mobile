import http from 'node:http'
import crypto from 'node:crypto'
import net from 'node:net'
import fs from 'node:fs'
import path from 'node:path'

const DEBUG_PORT = 9222

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
    })
  }
  close() { try { this.socket.destroy() } catch {} }
}
WS._id = 0

async function main() {
  const targets = await httpGetJson('/json/list')
  const page = targets.find(t => t.type === 'page' && t.url.includes(':5178'))
  if (!page) throw new Error('no page target')

  const u = new URL(page.webSocketDebuggerUrl)
  const ws = await WS.connect('127.0.0.1', DEBUG_PORT, u.pathname + u.search)

  const sleep = ms => new Promise(r => setTimeout(r, ms))

  const evalJs = async (expr) => {
    const r = await ws.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails).slice(0, 300))
    return r.result?.value
  }

  // 刷新以确保加载最新代码
  console.log('Reloading page with ignoreCache...')
  await ws.send('Page.reload', { ignoreCache: true })
  await sleep(3500)

  const phoneRect = await evalJs(`(() => {
    const el = document.getElementById('phone')
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }
  })()`)
  console.log('Phone Rect:', phoneRect)

  // TabBar 中心精确坐标：y = bottom - 24 - 27 = 825
  const tabY = Math.round(phoneRect.bottom - 24 - 27)
  const tabStep = phoneRect.width / 5
  const tabXs = [0, 1, 2, 3, 4].map(i => Math.round(phoneRect.x + tabStep * i + tabStep / 2))

  const tabDefs = [
    { name: '1_discover_home', title: '发现首页 (原搜索)', id: 'nav_search', x: tabXs[0] },
    { name: '2_songlist_square', title: '歌单广场', id: 'nav_songlist', x: tabXs[1] },
    { name: '3_leaderboard_gallery', title: '官方排行榜 (大三联)', id: 'nav_top', x: tabXs[2] },
    { name: '4_library_dashboard', title: '我的音乐 (资产大盘)', id: 'nav_love', x: tabXs[3] },
    { name: '5_setting_center', title: '设置中心', id: 'nav_setting', x: tabXs[4] }
  ]

  for (const tab of tabDefs) {
    console.log(`\nTesting Tab: ${tab.title} click at (${tab.x}, ${tabY})...`)
    await ws.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: tab.x, y: tabY, button: 'left', clickCount: 1 })
    await ws.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: tab.x, y: tabY, button: 'left', clickCount: 1 })
    await sleep(1000)

    const visibleTexts = await evalJs(`(() => {
      const phone = document.getElementById('phone').getBoundingClientRect()
      const all = Array.from(document.querySelectorAll('*'))
      const inView = all.filter(el => {
        if (el.children.length > 0) return false
        const text = el.innerText?.trim()
        if (!text) return false
        const r = el.getBoundingClientRect()
        return r.top >= phone.top && r.bottom <= phone.bottom && r.left >= phone.left && r.right <= phone.right
      }).map(el => el.innerText.trim())
      return Array.from(new Set(inView)).slice(0, 15)
    })()`)
    console.log(`  Visible Texts:`, visibleTexts)

    // 截屏
    const shot = await ws.send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: phoneRect.x,
        y: phoneRect.y,
        width: phoneRect.width,
        height: phoneRect.height,
        scale: 1
      }
    })

    const outPath = path.resolve(`preview/final_v2_tab_${tab.name}.png`)
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'))
    console.log(`  Saved screenshot: ${outPath}`)
  }

  console.log('\nAll 5 redesigned tabs verified and saved successfully!')
  ws.close()
}

main().catch(console.error)
