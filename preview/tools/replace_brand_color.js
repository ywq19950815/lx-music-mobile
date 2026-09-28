const fs = require('fs')
const path = require('path')

// 品牌色统一：写死的暖金 -> QQ音乐绿，暂停态深金 -> QQ绿深。
// 保留业务语义色（如 HotSearch 第三名棕橙 #B45309）不动。
const REPLACEMENTS = [
  [/#F5A623/gi, '#31C27C'],
  [/#E08C0F/gi, '#1E9E63'],
]

const root = path.resolve(__dirname, '../../src')
let updated = 0
const touched = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) { walk(p); continue }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue
    let s = fs.readFileSync(p, 'utf8')
    const before = s
    for (const [re, to] of REPLACEMENTS) s = s.replace(re, to)
    if (s !== before) {
      fs.writeFileSync(p, s)
      updated++
      touched.push(path.relative(root, p))
    }
  }
}

walk(root)
console.log('updated files:', updated)
touched.forEach(f => console.log('  -', f))
