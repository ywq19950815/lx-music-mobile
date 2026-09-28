import RNFS from 'react-native-fs'
import versionActions from '@/store/version/action'
import versionState from '@/store/version/state'
import { saveIgnoreVersion, getIgnoreVersion } from '@/utils/data'
import { showVersionModal } from '@/navigation/utils'
import { Navigation } from 'react-native-navigation'
import { compareVer } from '@/utils'
import { installApk } from '@/utils/nativeModules/utils'
import { toast } from '@/utils/tools'

/**
 * 应用内检查更新（安迪音乐 fork 专用）
 *
 * 更新源：中转服务器静态托管（HTTPS，国内直连可达）
 *   - 版本信息：https://music.xywqfry.cn/app-update/update.json
 *   - APK 包：同目录下 arm64-v8a 主力包
 * 流程：fetch manifest → compareVer 比对 → 弹窗展示更新说明 → RNFS 下载 → 唤起系统安装器
 */
const UPDATE_INFO_URL = 'https://music.xywqfry.cn/app-update/update.json'
const APK_SAVE_PATH = `${RNFS.CachesDirectoryPath}/andy-music-update.apk`
const FILE_PROVIDER_AUTHORITY = 'cn.toside.music.mobile.provider'

interface UpdateManifest {
  version: string
  desc?: string
  url?: string
  history?: LX.VersionInfo[]
}

export const showModal = () => {
  if (versionState.showModal) return
  versionActions.setVisibleModal(true)
  showVersionModal()
}

export const hideModal = (componentId: string) => {
  if (!versionState.showModal) return
  versionActions.setVisibleModal(false)
  void Navigation.dismissOverlay(componentId)
}

/**
 * 检查更新：请求更新源 manifest 并与当前版本比对
 * - 比当前版本新：写入 newVersion，且未被「忽略」时自动弹出更新窗口
 * - 已是最新：isLatest = true
 * - 请求失败：isUnknown = true（弹窗内提供重试）
 */
export const checkUpdate = async() => {
  versionActions.setVersionInfo({ ...versionState.versionInfo, status: 'checking', isUnknown: false })

  let manifest: UpdateManifest | null = null
  try {
    const resp = await fetch(UPDATE_INFO_URL, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    })
    if (resp.ok) manifest = await resp.json()
  } catch {
    manifest = null
  }

  const currentVer = process.versions.app

  if (!manifest?.version) {
    versionActions.setVersionInfo({
      ...versionState.versionInfo,
      status: 'idle',
      isUnknown: true,
      isLatest: false,
    })
    return
  }

  const isLatest = compareVer(currentVer, manifest.version) >= 0
  versionActions.setVersionInfo({
    ...versionState.versionInfo,
    status: 'idle',
    isUnknown: false,
    isLatest,
    newVersion: {
      version: manifest.version,
      desc: manifest.desc ?? '',
      history: manifest.history,
      url: manifest.url,
    },
  })

  if (!isLatest) {
    const ignored = versionState.ignoreVersion ?? await getIgnoreVersion()
    if (ignored !== manifest.version) showModal()
  }
}

let isDownloading = false

/**
 * 下载新版 APK 并唤起系统安装器
 * - 已下载完成：直接唤起安装
 * - 下载中：忽略重复点击
 * - 进度实时写入 store（更新窗口展示「当前/总量 (百分比)」）
 */
export const downloadUpdate = () => {
  if (isDownloading) return

  // 已下载完成，直接安装
  if (versionState.versionInfo.status === 'downloaded') {
    installApk(APK_SAVE_PATH, FILE_PROVIDER_AUTHORITY).catch(() => {
      versionActions.setVersionInfo({ ...versionState.versionInfo, status: 'error' })
    })
    return
  }

  const info = versionState.versionInfo.newVersion
  if (!info?.url) {
    toast('暂无可用更新包')
    return
  }

  isDownloading = true
  versionActions.setVersionInfo({ ...versionState.versionInfo, status: 'downloading' })
  versionActions.setProgress({ total: 0, current: 0 })

  RNFS.downloadFile({
    fromUrl: info.url,
    toFile: APK_SAVE_PATH,
    background: false,
    connectionTimeout: 30000,
    readTimeout: 60000,
    progressInterval: 250,
    progress: (res) => {
      versionActions.setProgress({ total: res.contentLength, current: res.bytesWritten })
    },
  }).promise.then(async() => {
    versionActions.setVersionInfo({ ...versionState.versionInfo, status: 'downloaded' })
    await installApk(APK_SAVE_PATH, FILE_PROVIDER_AUTHORITY)
  }).catch(() => {
    versionActions.setVersionInfo({ ...versionState.versionInfo, status: 'error' })
  }).finally(() => {
    isDownloading = false
  })
}

export const setIgnoreVersion = (version: string | null) => {
  versionActions.setIgnoreVersion(version)
  void saveIgnoreVersion(version)
}
