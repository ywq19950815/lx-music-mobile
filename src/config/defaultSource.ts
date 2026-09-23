/**
 * 内置精选音源配置库（共 10 款）
 *
 * App 启动时会自动确保这 10 款精选音源全部预装在「自定义源」列表中，
 * 默认推荐激活「全豆要[聚合音源]」，同时用户可在设置页面随时自由切换任意一款，
 * 或在误删后一键恢复全部内置音源。
 */

export interface BuiltinSourceMeta {
  key: string
  name: string
  alias: string
  version: string
  author: string
  description: string
  isDefault?: boolean
}

export const BUILTIN_SOURCE_METAS: readonly BuiltinSourceMeta[] = [
  {
    key: 'qdy',
    name: '全豆要[聚合音源]',
    alias: '全豆要',
    version: '9.3',
    author: '全豆要',
    description: '聚合星海/溯音/念心/长青多链路自动回退（推荐默认）',
    isDefault: true,
  },
  {
    key: 'sixyin',
    name: '六音音源',
    alias: '六音',
    version: '1.2.1',
    author: '六音',
    description: '经典优质第三方音源，全网主流平台全覆盖',
  },
  {
    key: 'changqing',
    name: '长青SVIP音源',
    alias: '长青',
    version: '1.3.0',
    author: 'SVIP',
    description: '高品质SVIP音源，支持酷狗/企鹅/网易/酷我/咪咕',
  },
  {
    key: 'lx',
    name: '独家音源',
    alias: '独家',
    version: '6',
    author: 'w',
    description: '独家音源 v6 最新版，多接口聚合线路',
  },
  {
    key: 'huibq',
    name: 'Huibq_lxmusic源',
    alias: 'Huibq',
    version: '1.2.0',
    author: 'Huibq',
    description: '轻量高效全平台音源接口',
  },
  {
    key: 'flower',
    name: '野花🌷',
    alias: '野花',
    version: '1',
    author: '内置音源',
    description: '覆盖酷我/网易/咪咕/企鹅/酷狗主流平台',
  },
  {
    key: 'huanyin',
    name: '幻音音源',
    alias: '幻音',
    version: '3',
    author: '竹佀',
    description: '企鹅/酷我/网易/咪咕精选线路',
  },
  {
    key: 'ikun',
    name: 'ikun音源',
    alias: 'ikun',
    version: '22',
    author: 'ikunshare',
    description: '第三方稳定接口，多音质解析支持',
  },
  {
    key: 'grass',
    name: '野草🌾',
    alias: '野草',
    version: '1',
    author: '内置音源',
    description: '酷我高保真快速线路支持',
  },
  {
    key: 'juhe',
    name: '聚合API接口 (CF)',
    alias: '聚合API',
    version: '3',
    author: 'lerd',
    description: 'CF 加速聚合 API 接口，云端动态解析',
  },
] as const

export const DEFAULT_SOURCE = {
  /** 默认推荐音源名称 */
  name: '全豆要[聚合音源]',
  /** 本地存储标记 key，记录全部内置源是否已初始化（带版本号以便自动增量安装） */
  storageKey: '@builtin_sources_all_v10_installed',
  /** 版本号 */
  version: '9.3',
} as const

/**
 * 判断某个用户音源是否为内置推荐默认音源（全豆要）
 */
export const isDefaultSourceName = (name?: string) => {
  if (!name) return false
  return name.includes('全豆要') || name.includes('聚合音源') || name === DEFAULT_SOURCE.name
}

/**
 * 判断某个用户音源是否属于 10 款内置音源之一
 */
export const isBuiltinSourceName = (name?: string) => {
  if (!name) return false
  return BUILTIN_SOURCE_METAS.some(item => name.includes(item.name) || name.includes(item.alias))
}

/**
 * 判断某个音源是否为需要清理的历史旧版失效音源（如早期失效的独家音源 v1.1.0，但保留最新的 v6）
 */
export const isLegacyDefaultSourceName = (name?: string, version?: string) => {
  if (!name) return false
  if (name.includes('独家音源')) {
    // 只有 1.x 等老版本才视为 legacy，新版 v6 正常保留
    if (!version || version.startsWith('1.') || version === '1.1.0') return true
  }
  return false
}
