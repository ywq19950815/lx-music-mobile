import { Navigation } from 'react-native-navigation'
import { setImmersiveSystemBars } from '@/utils/nativeModules/utils'
import { setNavigationBarHeight, setStatusbarHeight } from '@/core/common'

/**
 * 沉浸式系统栏（顶部状态栏 + 底部导航栏「小白条」）统一入口。
 *
 * <h3>为什么需要「反复应用」</h3>
 * react-native-navigation 在每次应用页面 options 时都会调用
 * `WindowCompat.setDecorFitsSystemWindows(window, true)`（RNN 的
 * SystemUiUtils.showStatusBar / showNavigationBar），把窗口收缩到两条系统栏之间 ——
 * 于是内容无法绘制到状态栏与手势条下面，两条系统栏只能露出系统底色，
 * 在新粗野主义的浅色界面上就是两条突兀的深色缝隙，「状态栏沉浸」永远做不出来。
 *
 * RNN 的 navigationBar 选项只有 visible / backgroundColor，没有 drawBehind，
 * 无法从 JS 打开 edge-to-edge。所以只能：
 *   1. 原生侧在 RNN 之后重新 setDecorFitsSystemWindows(false)（见 SystemBars.java）；
 *   2. JS 侧在每次页面出现（componentDidAppear）后再补一次，抢回被 RNN 覆盖的设置。
 */

let inited = false
let applying = false
let timer: ReturnType<typeof setTimeout> | null = null

const apply = async() => {
  if (applying) return
  applying = true
  try {
    // ⚠️ 新粗野主义改版后界面「永远是浅色」（米白/亮黄），与用户的主题设置无关，
    // 所以系统栏图标固定用深色。若跟着 theme.isDark 走，深色主题下会变成白色图标，
    // 落在亮黄头部上基本看不见。
    const insets = await setImmersiveSystemBars(true)
    // 顶部：头部标题栏需要给状态栏留白（沉浸后内容会顶到状态栏下面）
    if (insets.statusBarHeight > 0) setStatusbarHeight(Math.round(insets.statusBarHeight))
    // 底部：底部菜单栏需要给「小白条」留白
    setNavigationBarHeight(Math.round(insets.navigationBarHeight))
  } finally {
    applying = false
  }
}

/**
 * 应用一次沉浸式设置。
 * 合并短时间内的高频调用（连续导航 / push+pop），并延后补两次：
 * RNN 应用 options 是原生异步过程，紧随其后的那一次调用常常还会被它覆盖。
 */
export const applyImmersiveSystemBars = () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void apply()
    setTimeout(() => { void apply() }, 150)
  }, 0)
}

export const initSystemBars = () => {
  if (inited) return
  inited = true

  applyImmersiveSystemBars()

  // 主题切换：系统栏图标的明暗要跟着换
  global.state_event.on('themeUpdated', () => {
    applyImmersiveSystemBars()
  })

  // 每次页面出现都抢一次（RNN 刚把窗口拉回非沉浸）
  try {
    Navigation.events().registerComponentDidAppearListener(() => {
      applyImmersiveSystemBars()
    })
  } catch (err) {
    // 非 RNN 环境（Web 预览）忽略
  }
}
