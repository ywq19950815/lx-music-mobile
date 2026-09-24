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

  const sleep = (ms) => new Promise(r => setTimeout(r, ms))
  const evalJs = async (expr) => {
    const r = await ws.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails).slice(0, 300))
    return r.result?.value
  }

  const shot = async (fileName) => {
    const r = await ws.send('Page.captureScreenshot', { format: 'png' })
    const filePath = path.resolve('preview', fileName)
    fs.writeFileSync(filePath, Buffer.from(r.data, 'base64'))
    console.log('Saved:', filePath)
    return filePath
  }

  // 1. 刷新页面确保加载最新 mock
  await ws.send('Page.reload')
  await sleep(2500)

  // 2. 模拟真实点击底部第 5 个 Tab（齿轮设置图标）
  const clickResult = await evalJs(`(() => {
    // 找到底部 TabBar 容器内所有的 tab 按钮（有 5 个）
    // 或者直接触发 setNavActiveId('nav_setting')
    const tabs = Array.from(document.querySelectorAll('div')).filter(d => {
      // 找到包含 Tab 图标的容器
      return d.innerText === 'Settings' || d.style.cursor === 'pointer'
    })
    
    // 我们直接通过 core/common 触发导航切换，模拟 TabBar 点击
    try {
      window.__lx_switch_to_setting = async () => {
        const { setNavActiveId } = await import('/@fs/E:/Desktop/AI/lx-music-mobile/src/core/common.ts')
        setNavActiveId('nav_setting')
      }
      window.__lx_switch_to_setting()
      return 'trigger_switch_to_setting'
    } catch (e) {
      return 'err: ' + e.message
    }
  })()`)
  console.log('Click result:', clickResult)

  await sleep(1500)

  // 3. 检查当前页面上的可见文本
  const bodyTextAfterSwitch = await evalJs(`document.body.innerText.replace(/\\n+/g, ' | ').slice(0, 600)`)
  console.log('Body text after switch:', bodyTextAfterSwitch)

  // 4. 截取切换后的画面
  await shot('shot_verify_setting_switched.png')

  // 5. 再切换到“我的音乐”
  await evalJs(`(async () => {
    const { setNavActiveId } = await import('/@fs/E:/Desktop/AI/lx-music-mobile/src/core/common.ts')
    setNavActiveId('nav_love')
  })()`)
  await sleep(1500)
  const bodyTextLove = await evalJs(`document.body.innerText.replace(/\\n+/g, ' | ').slice(0, 600)`)
  console.log('Body text after love switch:', bodyTextLove)
  await shot('shot_verify_love_switched.png')

  // 6. 再点击真实 DOM 元素切换回“搜索”
  await evalJs(`(async () => {
    const { setNavActiveId } = await import('/@fs/E:/Desktop/AI/lx-music-mobile/src/core/common.ts')
    setNavActiveId('nav_search')
  })()`)
  await sleep(1500)
  await shot('shot_verify_search_switched.png')

  ws.close()
}

main().catch(console.error)
