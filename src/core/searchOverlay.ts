/**
 * 独立搜索页调度器（2026-09-29 需求：搜索页面独立出来）。
 * 各处搜索入口（音乐馆圆钮 / 歌单广场快捷搜索）不再切换到发现页，
 * 统一通过这里打开全屏搜索覆盖层，并携带触发按钮的屏幕坐标用于「图标 → 搜索框」形变动画。
 */
export interface SearchOverlayRect {
  x: number
  y: number
  width: number
  height: number
}

type SearchOverlayOpenHandler = (rect?: SearchOverlayRect, keyword?: string) => void

let openHandler: SearchOverlayOpenHandler | null = null

/** 由 SearchOverlay 组件挂载时注册，卸载时注销 */
export const registerSearchOverlay = (handler: SearchOverlayOpenHandler | null) => {
  openHandler = handler
}

/** 打开独立搜索页；rect 为触发按钮的窗口坐标（measureInWindow），keyword 为自动执行的搜索词 */
export const openSearchOverlay = (rect?: SearchOverlayRect, keyword?: string) => {
  openHandler?.(rect, keyword)
}
