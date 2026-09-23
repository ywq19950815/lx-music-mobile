
import { getAppearance, getIsSupportedAutoTheme, onAppearanceChange } from '@/utils/tools'
import { setShouldUseDarkColors, applyTheme } from '@/core/theme'
import { getTheme } from '@/theme/themes/index'
import settingState from '@/store/setting/state'
import StatusBar from '@/components/common/StatusBar'
// import { Dimensions, PixelRatio } from 'react-native'


export default async(setting: LX.AppSetting) => {
  // Neo-Brutalism 全局浅色高对比度基线：固定深色图标，不跟随系统夜间模式
  setShouldUseDarkColors(false)

  if (getIsSupportedAutoTheme()) {
    onAppearanceChange(() => {
      // 保持全站浅色
      setShouldUseDarkColors(false)
    })
  }

  applyTheme(await getTheme())

  global.state_event.on('themeUpdated', () => {
    // 界面永远走浅色波普底纸，状态栏图标固定深色（dark-content）
    StatusBar.setBarStyle('dark-content')
  })
  // onDimensionChange(({ window }) => {
  //   let screenW = window.width
  //   let screenH = window.height
  //   if (screenW > screenH) {
  //     const temp = screenW
  //     screenW = screenH
  //     screenH = temp
  //   }
  //   global.lx.windowInfo.screenW = screenW
  //   global.lx.windowInfo.screenH = screenH
  //   global.lx.windowInfo.screenPxW = PixelRatio.getPixelSizeForLayoutSize(screenW)
  //   global.lx.windowInfo.screenPxH = PixelRatio.getPixelSizeForLayoutSize(screenH)
  //   console.log('change', global.lx.windowInfo)
  // })
}
