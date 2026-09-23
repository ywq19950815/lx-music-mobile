/**
 * 内置默认音源配置
 *
 * App 首次启动时会自动把该音源安装到「自定义源」列表中，并设为当前音源，
 * 让用户装上就能直接搜歌、听歌，不需要自己去找源。
 * 现已内置最新多源聚合脚本（酷我/网易云/QQ/酷狗/咪咕全覆盖），免去网络依赖秒级生效。
 */
export const DEFAULT_SOURCE = {
  /** 展示名称，用于在音源列表中标识内置源 */
  name: '全豆要[聚合音源]（内置）',
  /** 本地存储标记 key，记录该内置源是否已经安装过（带版本号以便无缝自动升级） */
  storageKey: '@default_source_installed_v9.3',
  /** 版本号 */
  version: '9.3',
} as const

/**
 * 判断某个用户音源是否为内置默认音源。
 * 兼容最新内置源名称以及历史内置源名称。
 */
export const isDefaultSourceName = (name?: string) => {
  if (!name) return false
  return name.includes('全豆要') || name.includes('聚合音源') || name.includes('独家音源') || name === DEFAULT_SOURCE.name
}

/**
 * 判断某个音源是否为需要清理的旧版失效默认音源
 */
export const isLegacyDefaultSourceName = (name?: string) => {
  if (!name) return false
  return name.includes('独家音源')
}
