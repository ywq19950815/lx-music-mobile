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

  // 获取底部 5 个 Tab 按钮的坐标
  const tabsInfo = await evalJs(`(() => {
    // 页面最下方的 TabBar
    // TabBar 的每一个 Tab 是一个带有点击事件的元素
    const icons = Array.from(document.querySelectorAll('*')).filter(el => {
      // 找到含有 icomoon 字体图标的元素或者其父级可点击元素
      const style = window.getComputedStyle(el)
      return style.fontFamily && style.fontFamily.includes('icomoon')
    })
    return icons.map(i => {
      const r = i.getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, width: r.width, height: r.height, text: i.innerText }
    })
  })()`)
  console.log('Tabs Info:', JSON.stringify(tabsInfo, null, 2))

  // 如果找到多个图标，通常底部 TabBar 的 5 个图标在最下方（y 坐标最大）
  const bottomTabs = tabsInfo.filter(t => t.y > 700).sort((a, b) => a.x - b.x)
  console.log('Bottom Tabs count:', bottomTabs.length, bottomTabs)

  if (bottomTabs.length >= 5) {
    // 点击第 5 个 Tab（设置）
    const settingTab = bottomTabs[4]
    console.log('Clicking setting tab at:', settingTab.x, settingTab.y)
    await ws.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: settingTab.x, y: settingTab.y, button: 'left', clickCount: 1 })
    await ws.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: settingTab.x, y: settingTab.y, button: 'left', clickCount: 1 })
    
    await sleep(1500)
    await shot('click_result_setting.png')

    // 检查此时屏幕上的文字
    const textAfterClick = await evalJs(`document.body.innerText.replace(/\\n+/g, ' | ').slice(0, 400)`)
    console.log('Text after physical click:', textAfterClick)

    // 点击第 4 个 Tab（我的音乐）
    const mylistTab = bottomTabs[3]
    console.log('Clicking mylist tab at:', mylistTab.x, mylistTab.y)
    await ws.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: mylistTab.x, y: mylistTab.y, button: 'left', clickCount: 1 })
    await ws.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: mylistTab.x, y: mylistTab.y, button: 'left', clickCount: 1 })
    
    await sleep(1500)
    await shot('click_result_mylist.png')
    const textAfterMylist = await evalJs(`document.body.innerText.replace(/\\n+/g, ' | ').slice(0, 400)`)
    console.log('Text after mylist click:', textAfterMylist)
  }

  ws.close()
}

main().catch(console.error)
