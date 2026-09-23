import versionActions from '@/store/version/action'
import versionState, { type InitState } from '@/store/version/state'
import { saveIgnoreVersion } from '@/utils/data'
import { showVersionModal } from '@/navigation'
import { Navigation } from 'react-native-navigation'
import { toast } from '@/utils/tools'

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
 * 检查更新
 *
 * 本应用的版本体系已从 v0.x 重新开始，不再对外请求任何第三方仓库的版本信息
 * （原先会读取上游仓库的 version.json，从而误提示升级到与当前版本无关的旧版本号）。
 * 这里直接判定为「已是最新版本」，也不会触发行任何升级弹窗。
 */
export const checkUpdate = async() => {
  versionActions.setVersionInfo({
    ...versionState.versionInfo,
    status: 'idle',
    isUnknown: false,
    isLatest: true,
    newVersion: {
      version: process.versions.app,
      desc: '',
      history: [],
    },
  })
}

export const downloadUpdate = () => {
  toast('当前已是最新版本')
}

export const setIgnoreVersion = (version: InitState['ignoreVersion']) => {
  versionActions.setIgnoreVersion(version)
  saveIgnoreVersion(version)
}
