import fs from 'node:fs'
import path from 'node:path'

async function getCDPTarget() {
  const res = await fetch('http://127.0.0.1:9222/json')
  const targets = await res.json()
  return targets.find(t => t.url.includes('5178'))
}

async function run() {
  const target = await getCDPTarget()
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise(r => ws.onopen = r)
  let id = 1
  const send = (method, params = {}) => new Promise(resolve => {
    const curId = id++
    const handler = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.id === curId) {
        ws.removeEventListener('message', handler)
        resolve(msg.result)
      }
    }
    ws.addEventListener('message', handler)
    ws.send(JSON.stringify({ id: curId, method, params }))
  })

  const clickAt = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
    await new Promise(r => setTimeout(r, 60))
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
  }

  const phoneBox = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const el = document.getElementById('phone');
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height };
      })()
    `,
    returnByValue: true
  })
  const clip = phoneBox.result.value

  // 1. Go to Tab 4 (我的列表)
  console.log('Switching to Tab 4...')
  await clickAt(294, 825)
  await new Promise(r => setTimeout(r, 800))

  // Click on "我喜欢" card (around x: 110, y: 250)
  console.log('Clicking "我喜欢" card...')
  await clickAt(110, 250)
  await new Promise(r => setTimeout(r, 1000))

  let shot = await send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 2 } })
  let outPath = path.resolve('E:/Desktop/AI/lx-music-mobile/06_tab4_love_detail.png')
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'))
  console.log('Saved:', outPath)

  // 2. Go to Tab 3 (排行榜)
  console.log('Switching to Tab 3...')
  await clickAt(215, 825)
  await new Promise(r => setTimeout(r, 800))

  // Click on 飙升榜 card (around x: 200, y: 260)
  console.log('Clicking 飙升榜 card...')
  await clickAt(200, 260)
  await new Promise(r => setTimeout(r, 1000))

  shot = await send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 2 } })
  outPath = path.resolve('E:/Desktop/AI/lx-music-mobile/07_tab3_board_detail.png')
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'))
  console.log('Saved:', outPath)

  ws.close()
}

run().catch(console.error)
