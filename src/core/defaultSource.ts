import { getData, saveData } from '@/plugins/storage'
import {
  DEFAULT_SOURCE,
  BUILTIN_SOURCE_METAS,
  isDefaultSourceName,
  isLegacyDefaultSourceName,
} from '@/config/defaultSource'
import { addUserApi, getUserApiList, removeUserApi } from '@/utils/data'
import { BUILTIN_SOURCES, DEFAULT_SOURCE_SCRIPT } from '@/resources/builtinSources'
import { log } from '@/utils/log'

/**
 * 安装/恢复全部 10 款内置音源。
 *
 * @param forceUpdate 是否强制覆盖更新已有内置源（true: 全部重新装入；false: 仅补充安装缺失的源）
 * @returns 返回默认音源（全豆要）的 id，供后续自动选中
 */
export const installAllBuiltinSources = async(forceUpdate = false): Promise<{ defaultSourceId: string | null, totalInstalled: number }> => {
  try {
    // 1. 获取现有音源列表
    const currentList = await getUserApiList()

    // 2. 清理历史失效音源（如早期失效的独家音源 1.1.0）
    const legacyApis = currentList.filter(api => isLegacyDefaultSourceName(api.name, api.version))
    if (legacyApis.length) {
      await removeUserApi(legacyApis.map(a => a.id))
      log.info(`[defaultSource] 已清理历史失效音源: ${legacyApis.map(a => a.name).join(', ')}`)
    }

    // 重新获取列表
    const existingList = await getUserApiList()
    let defaultSourceId: string | null = null
    let totalInstalled = 0

    // 3. 逐个检查并安装内置音源
    for (const source of BUILTIN_SOURCES) {
      const existing = existingList.find(api =>
        api.name === source.name ||
        api.name.includes(source.alias) ||
        (source.isDefault && isDefaultSourceName(api.name)),
      )

      if (existing) {
        if (forceUpdate) {
          // 强制更新：先删除旧的，再安装新的
          await removeUserApi([existing.id])
          const newApi = await addUserApi(source.script)
          totalInstalled++
          log.info(`[defaultSource] 已重新安装内置源: ${source.name}(${newApi.id})`)
          if (source.isDefault || isDefaultSourceName(source.name)) {
            defaultSourceId = newApi.id
          }
        } else {
          // 已存在且不强制更新：保留现有
          if (source.isDefault || isDefaultSourceName(source.name)) {
            defaultSourceId = existing.id
          }
        }
      } else {
        // 尚未安装：执行安装
        const newApi = await addUserApi(source.script)
        totalInstalled++
        log.info(`[defaultSource] 已安装内置源: ${source.name}(${newApi.id})`)
        if (source.isDefault || isDefaultSourceName(source.name)) {
          defaultSourceId = newApi.id
        }
      }
    }

    // 4. 标记全部内置源已初始化
    await saveData(DEFAULT_SOURCE.storageKey, true)
    log.info(`[defaultSource] 内置音源库初始化完成，本次安装/更新 ${totalInstalled} 个`)

    return { defaultSourceId, totalInstalled }
  } catch (err: any) {
    log.error(`[defaultSource] 安装内置音源失败: ${err?.message ?? err}`)
    return { defaultSourceId: null, totalInstalled: 0 }
  }
}

/**
 * 安装单个默认推荐音源（全豆要），保持向后兼容
 */
export const installDefaultSource = async(): Promise<string | null> => {
  const res = await installAllBuiltinSources(false)
  if (res.defaultSourceId) return res.defaultSourceId

  // 兜底单独安装默认脚本
  try {
    const apiInfo = await addUserApi(DEFAULT_SOURCE_SCRIPT)
    return apiInfo.id
  } catch (err: any) {
    log.error(`[defaultSource] 兜底安装默认音源失败: ${err?.message ?? err}`)
    return null
  }
}

/**
 * 查找已安装的默认推荐音源（全豆要）的 id
 */
export const findInstalledDefaultSource = async(): Promise<string | null> => {
  const list = await getUserApiList()
  const target = list.find(api => isDefaultSourceName(api.name))
  return target?.id ?? null
}

/**
 * 检查全部内置音源是否已安装
 */
export const isDefaultSourceInstalled = async(): Promise<boolean> => {
  const isKeySet = (await getData<boolean>(DEFAULT_SOURCE.storageKey)) === true
  if (isKeySet) return true
  const list = await getUserApiList()
  const defaultApi = list.find(api => isDefaultSourceName(api.name))
  return !!defaultApi
}

/**
 * 启动时确保全部内置音源完整可用：
 * 若有缺失则自动补充安装，确保用户拥有全套 10 个可用音源。
 */
export const ensureDefaultSource = async(): Promise<string | null> => {
  const isKeySet = (await getData<boolean>(DEFAULT_SOURCE.storageKey)) === true
  const list = await getUserApiList()

  // 检查是否 10 个内置源都已经安装了
  const installedCount = BUILTIN_SOURCE_METAS.filter(meta =>
    list.some(api => api.name === meta.name || api.name.includes(meta.alias)),
  ).length

  if (isKeySet && installedCount >= BUILTIN_SOURCE_METAS.length) {
    return findInstalledDefaultSource()
  }

  // 缺失任何内置源，或标记尚未设置，自动执行静默增量补全
  const res = await installAllBuiltinSources(false)
  return res.defaultSourceId ?? (await findInstalledDefaultSource())
}
