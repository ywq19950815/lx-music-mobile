import { getData, saveData } from '@/plugins/storage'
import { DEFAULT_SOURCE, isDefaultSourceName, isLegacyDefaultSourceName } from '@/config/defaultSource'
import { addUserApi, getUserApiList, removeUserApi } from '@/utils/data'
import { DEFAULT_SOURCE_SCRIPT } from '@/resources/defaultSourceScript'
import { log } from '@/utils/log'

/**
 * 安装内置默认音源（全豆要[聚合音源] v9.3 特供版）。
 *
 * 采用本地预置脚本常量直接安装，彻底摆脱网络环境和代理不稳定问题，
 * 同时自动清理历史旧版失效音源，保证用户开箱即用。
 *
 * @returns 安装成功时返回音源 id，失败返回 null（静默降级，不阻断 App 启动）
 */
export const installDefaultSource = async(): Promise<string | null> => {
  try {
    // 1. 查找并清理旧版失效音源（如独家音源）
    const list = await getUserApiList()
    const legacyApis = list.filter(api => isLegacyDefaultSourceName(api.name))
    if (legacyApis.length) {
      await removeUserApi(legacyApis.map(a => a.id))
      log.info(`[defaultSource] 已清理旧版失效音源: ${legacyApis.map(a => a.name).join(', ')}`)
    }

    // 2. 直接安装内置打包的可靠音源脚本
    const apiInfo = await addUserApi(DEFAULT_SOURCE_SCRIPT)

    // 3. 记录最新版本标记
    await saveData(DEFAULT_SOURCE.storageKey, true)
    log.info(`[defaultSource] 默认音源安装成功: ${apiInfo.name}(${apiInfo.id})`)
    return apiInfo.id
  } catch (err: any) {
    log.error(`[defaultSource] 默认音源安装失败: ${err?.message ?? err}`)
    return null
  }
}

/**
 * 查找已安装的最新内置默认音源，返回其 id（未安装则返回 null）
 */
export const findInstalledDefaultSource = async(): Promise<string | null> => {
  const list = await getUserApiList()
  const target = list.find(api => api.name.includes('全豆要') || api.name === DEFAULT_SOURCE.name)
  return target?.id ?? null
}

/**
 * 判断最新内置默认音源是否已经安装过（依据本地标记 + 实际列表双重确认）
 */
export const isDefaultSourceInstalled = async(): Promise<boolean> => {
  if (await findInstalledDefaultSource()) return true
  return (await getData<boolean>(DEFAULT_SOURCE.storageKey)) === true
}

/**
 * 确保内置默认音源可用：
 * 已安装且版本匹配则直接返回其 id；未安装或为旧版则执行安装/升级后返回。
 */
export const ensureDefaultSource = async(): Promise<string | null> => {
  const installed = await findInstalledDefaultSource()
  const isKeySet = (await getData<boolean>(DEFAULT_SOURCE.storageKey)) === true
  if (installed && isKeySet) return installed
  return installDefaultSource()
}
