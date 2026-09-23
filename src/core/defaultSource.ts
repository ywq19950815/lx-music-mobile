import { getData, saveData } from '@/plugins/storage'
import { DEFAULT_SOURCE, isDefaultSourceName } from '@/config/defaultSource'
import { addUserApi, getUserApiList } from '@/utils/data'
import { httpFetch } from '@/utils/request'
import { log } from '@/utils/log'

/**
 * 从给定地址下载音源脚本
 */
const fetchScript = async(url: string): Promise<string> => {
  return await httpFetch(url, { method: 'get', timeout: 25_000 }).promise.then(resp => resp.body as string)
}

/**
 * 下载并安装内置默认音源。
 *
 * @returns 安装成功时返回音源 id，失败返回 null（静默降级，不阻断 App 启动）
 */
export const installDefaultSource = async(): Promise<string | null> => {
  const urls = [DEFAULT_SOURCE.url, DEFAULT_SOURCE.fallbackUrl]
  let script = ''
  let lastError: Error | null = null

  // 主地址优先（ghproxy 加速），失败再试原始地址
  for (const url of urls) {
    try {
      script = await fetchScript(url)
      if (script && script.length > 100) break
      script = ''
      lastError = new Error('empty script')
    } catch (err: any) {
      lastError = err as Error
      log.warn(`[defaultSource] 下载失败 ${url}: ${err?.message ?? err}`)
    }
  }

  if (!script) {
    log.error(`[defaultSource] 默认音源下载失败: ${lastError?.message ?? 'unknown'}`)
    return null
  }

  const apiInfo = await addUserApi(script)
  // 记录安装标记，避免每次启动都重复下载
  await saveData(DEFAULT_SOURCE.storageKey, true)
  log.info(`[defaultSource] 默认音源安装成功: ${apiInfo.name}(${apiInfo.id})`)
  return apiInfo.id
}

/**
 * 查找已安装的内置默认音源，返回其 id（未安装则返回 null）
 */
export const findInstalledDefaultSource = async(): Promise<string | null> => {
  const list = await getUserApiList()
  const target = list.find(api => isDefaultSourceName(api.name))
  return target?.id ?? null
}

/**
 * 判断内置默认音源是否已经安装过（依据本地标记 + 实际列表双重确认）
 */
export const isDefaultSourceInstalled = async(): Promise<boolean> => {
  if (await findInstalledDefaultSource()) return true
  return (await getData<boolean>(DEFAULT_SOURCE.storageKey)) === true
}

/**
 * 确保内置默认音源可用：
 * 已安装则直接返回其 id；未安装则下载安装后返回。
 */
export const ensureDefaultSource = async(): Promise<string | null> => {
  const installed = await findInstalledDefaultSource()
  if (installed) return installed
  return installDefaultSource()
}
