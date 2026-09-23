/**
 * 内置默认音源配置
 *
 * App 首次启动时会自动把该音源安装到「自定义源」列表中，并设为当前音源，
 * 让用户装上就能直接搜歌、听歌，不需要自己去找源。
 *
 * 该地址使用 ghproxy.net 代理加速 raw.githubusercontent.com，
 * 避免部分地区直连 GitHub 失败导致音源下载不下来。
 */
export const DEFAULT_SOURCE = {
  /** 音源脚本下载地址（ghproxy.net 加速） */
  url: 'https://ghproxy.net/raw.githubusercontent.com/pdone/lx-music-source/main/lx/latest.js',
  /** 原始地址（代理失败时的兜底重试地址） */
  fallbackUrl: 'https://raw.githubusercontent.com/pdone/lx-music-source/main/lx/latest.js',
  /** 展示名称，用于在音源列表中标识内置源 */
  name: '独家音源（内置）',
  /** 本地存储标记 key，记录该内置源是否已经安装过 */
  storageKey: '@default_source_installed',
} as const

/**
 * 判断某个用户音源是否为内置默认音源。
 * 由于内置源是通过「在线导入」落地的普通用户音源，只能用名称做弱匹配，
 * 这里同时兼容脚本头里的 @name 与本地安装时写入的名字。
 */
export const isDefaultSourceName = (name?: string) => {
  if (!name) return false
  return name.includes('独家音源') || name === DEFAULT_SOURCE.name
}
