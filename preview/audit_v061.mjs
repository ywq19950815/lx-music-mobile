// v0.6.1 全页面视觉巡检：App 自身 action 切页 + 全序列按压派发点击 + JS 报错收集
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
        if (header.includes('\r\n\r\n')) { socket.removeListener('data', onData); res() }
      }
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
            if (msg.id && this.pending.has(msg.id)) {
              this.pending.get(msg.id)(msg); this.pending.delete(msg.id)
            } else if (msg.method) this.onEvent(msg)
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
  if (!page) throw new Error('no page target')
  const u = new URL(page.webSocketDebuggerUrl)
  const ws = await WS.connect('127.0.0.1', DEBUG_PORT, u.pathname + u.search)
  ws.start()
  const jsErrors = []
  ws.onEvent = (msg) => {
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails
      jsErrors.push('EXC: ' + ((d.exception?.description || d.text) || '').slice(0, 200))
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      jsErrors.push('ERR: ' + msg.params.args.map(a => a.value || a.description || '').join(' ').slice(0, 200))
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
  const signature = async (tag) => {
    const s = await evalJs(`document.body.innerText.replace(/\\s+/g,' ').slice(0,150)`)
    console.log(`[${tag}] ` + s)
  }
  const goto = async (tab) => {
    await evalJs(`(async () => {
      const m = await import('${SRC}/core/common.ts')
      m.setNavActiveId('${tab}')
    })()`)
    await sleep(1500)
  }
  // 点击：按可见文本精确匹配叶子元素，派发完整按压序列
  const clickText = async (txt, mode = 'exact') => {
    const ok = await evalJs(`(() => {
      const norm = s => s.replace(/\\s+/g,'')
      const target = norm(${JSON.stringify(txt)})
      const els = [...document.querySelectorAll('div,span')]
      const leaves = els.filter(e => {
        const t = norm(e.textContent || '')
        if (!t) return false
        if (${JSON.stringify(mode)} === 'exact' ? t !== target : !t.includes(target)) return false
        return e.children.length === 0 || e.textContent.length < 30
      })
      const el = leaves[leaves.length - 1]
      if (!el) return false
      const fire = (type, ctor) => el.dispatchEvent(new ctor(type, { bubbles: true, cancelable: true, view: window }))
      fire('pointerdown', PointerEvent); fire('mousedown', MouseEvent)
      setTimeout(() => { fire('pointerup', PointerEvent); fire('mouseup', MouseEvent); fire('click', MouseEvent) }, 60)
      return true
    })()`)
    await sleep(1500)
    return ok
  }

  // 1 发现页
  await goto('nav_search')
  await shot('v061_01_discover.png')
  await signature('discover')

  // 2 搜索结果：填输入框 + 回车
  const searched = await evalJs(`(() => {
    const input = document.querySelector('input')
    if (!input) return false
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(input, '周杰伦')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }))
    return true
  })()`)
  await sleep(3000)
  console.log('search typed:', searched)
  await shot('v061_02_search_result.png')
  await signature('search')

  // 3 歌单广场
  await goto('nav_songlist')
  await shot('v061_03_songlist.png')
  await signature('songlist')

  // 4 歌单详情：点第一张歌单卡（含 borderRadius 12 的可点容器）
  const cardClicked = await evalJs(`(() => {
    const divs = [...document.querySelectorAll('div')]
    const cards = divs.filter(d => {
      const s = d.getAttribute('style') || ''
      return (s.includes('border-radius: 12px') || s.includes('border-radius:12px')) && (d.textContent || '').length > 6 && (d.textContent || '').length < 120
    })
    if (!cards.length) return false
    const el = cards[0]
    const fire = (type, ctor) => el.dispatchEvent(new ctor(type, { bubbles: true, cancelable: true, view: window }))
    fire('pointerdown', PointerEvent); fire('mousedown', MouseEvent)
    setTimeout(() => { fire('pointerup', PointerEvent); fire('mouseup', MouseEvent); fire('click', MouseEvent) }, 60)
    return true
  })()`)
  await sleep(3500)
  console.log('songlist card clicked:', cardClicked)
  await shot('v061_04_songlist_detail.png')
  await signature('songlist_detail')

  // 5 排行榜
  await goto('nav_top')
  await sleep(800)
  await shot('v061_05_leaderboard.png')
  await signature('leaderboard')

  // 6 榜单详情：点第一张大卡
  const boardClicked = await evalJs(`(() => {
    const divs = [...document.querySelectorAll('div')]
    const cards = divs.filter(d => {
      const s = d.getAttribute('style') || ''
      return (s.includes('border-radius: 16px') || s.includes('border-radius:16px')) && (d.textContent || '').length > 20
    })
    if (!cards.length) return false
    const el = cards[cards.length - 1]
    const fire = (type, ctor) => el.dispatchEvent(new ctor(type, { bubbles: true, cancelable: true, view: window }))
    fire('pointerdown', PointerEvent); fire('mousedown', MouseEvent)
    setTimeout(() => { fire('pointerup', PointerEvent); fire('mouseup', MouseEvent); fire('click', MouseEvent) }, 60)
    return true
  })()`)
  await sleep(3500)
  console.log('board card clicked:', boardClicked)
  await shot('v061_06_board_detail.png')
  await signature('board_detail')

  // 7 我的
  await goto('nav_love')
  await shot('v061_07_mylist.png')
  await signature('mylist')

  // 8 设置主屏
  console.log('click 设置:', await clickText('设置'))
  await shot('v061_08_setting_main.png')
  await signature('setting')

  // 9 关于
  console.log('click 关于:', await clickText('关于', 'include'))
  await sleep(800)
  await shot('v061_09_about.png')
  await signature('about')

  // 10 播放页：回发现页点胶囊
  await goto('nav_search')
  const capClicked = await evalJs(`(() => {
    const divs = [...document.querySelectorAll('div')]
    const caps = divs.filter(d => {
      const s = d.getAttribute('style') || ''
      return s.includes('border-radius: 26px') || s.includes('border-radius:26px')
    })
    if (!caps.length) return false
    const el = caps[0]
    const fire = (type, ctor) => el.dispatchEvent(new ctor(type, { bubbles: true, cancelable: true, view: window }))
    fire('pointerdown', PointerEvent); fire('mousedown', MouseEvent)
    setTimeout(() => { fire('pointerup', PointerEvent); fire('mouseup', MouseEvent); fire('click', MouseEvent) }, 60)
    return true
  })()`)
  await sleep(2500)
  console.log('capsule clicked:', capClicked)
  await shot('v061_10_player.png')
  await signature('player')

  console.log('---- JS ERRORS ----')
  const uniq = [...new Set(jsErrors)]
  console.log(uniq.length ? uniq.slice(0, 20).join('\n') : '(none)')
  console.log('DONE')
  ws.close()
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
