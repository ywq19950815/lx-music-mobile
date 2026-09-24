import fs from 'node:fs'
import path from 'node:path'

async function getCDPTarget() {
  const res = await fetch('http://127.0.0.1:9222/json')
  const targets = await res.json()
  return targets.find(t => t.url.includes('5178'))
}

async function run() {
  const target = await getCDPTarget()
  if (!target) {
    console.error('Target not found')
    process.exit(1)
  }

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
  console.log('Phone clip:', clip)

  const captureTab = async (name, x, y) => {
    console.log(`Switching to ${name} at (${x}, ${y})...`)
    await clickAt(x, y)
    await new Promise(r => setTimeout(r, 1200))
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 2 } })
    const outPath = path.resolve(`E:/Desktop/AI/lx-music-mobile/${name}.png`)
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'))
    console.log(`Saved: ${outPath}`)
  }

  // 1. Tab 1: 发现首页
  await captureTab('01_tab1_discover_home', 58, 825)

  // 2. Tab 2: 歌单广场
  await captureTab('02_tab2_songlist_square', 136, 825)

  // 3. Tab 3: 排行榜 (大三联复合卡片流)
  await captureTab('03_tab3_leaderboard_gallery', 215, 825)

  // 4. Tab 4: 我的音乐 (资产大盘看板)
  await captureTab('04_tab4_mylist_dashboard', 294, 825)

  // 5. Tab 5: 设置中心
  await captureTab('05_tab5_setting_center', 372, 825)

  console.log('All 5 tabs captured successfully!')
  ws.close()
}

run().catch(console.error)
