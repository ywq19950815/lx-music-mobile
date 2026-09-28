const fs = require('fs')
const path = 'E:/Desktop/AI/lx-music-mobile/src/store/theme/state.ts'

// 把旧青绿色阶平移成 QQ音乐绿 #31C27C 的明暗阶梯（保持原明暗结构不变，只换 hue）
function hslToRgb(h, s, l) {
  s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  let r, g, b
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

const H = 151, S = 60 // QQ绿 #31C27C ≈ HSL(151,60,48)
const fmt = rgb => rgb.join(', ')
const base = '77, 175, 124' // 旧青绿基准
const darkL = [43, 40, 36, 33, 30, 26, 23, 20, 17, 14]
const lightL = [55, 61, 67, 73, 79, 84, 89, 93, 97, 100]
const darkOld = ['69, 158, 112', '62, 142, 101', '56, 128, 91', '50, 115, 82', '45, 104, 74', '41, 94, 67', '37, 85, 60', '33, 77, 54', '30, 69, 49', '27, 62, 44']
const lightOld = ['113, 191, 150', '141, 204, 171', '164, 214, 188', '182, 222, 201', '197, 229, 212', '209, 234, 221', '218, 238, 228', '225, 241, 233', '231, 244, 237', '255, 255, 255']

let content = fs.readFileSync(path, 'utf8')
content = content.split(base).join(fmt(hslToRgb(H, S, 48)))
darkOld.forEach((o, i) => { content = content.split(o).join(fmt(hslToRgb(H, S, darkL[i]))) })
lightOld.forEach((o, i) => { content = content.split(o).join(fmt(hslToRgb(H, S, lightL[i]))) })

fs.writeFileSync(path, content)
console.log('state.ts c-primary 色阶已平移为 QQ绿阶梯，基准 =', fmt(hslToRgb(H, S, 48)))
