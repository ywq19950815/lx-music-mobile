import { memo } from 'react'
import { View } from 'react-native'

import MoreBtn from './components/MoreBtn'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationBarHeight } from '@/store/common/hook'

const BASE_PADDING_BOTTOM = 12

/**
 * 播放页底部控制面板：深色沉浸。
 * - 与深空底同色 + 顶部 hairline 微光分隔
 * - 进度条 / 时间 / 主控 / 更多按钮自上而下
 */
export default memo(() => {
  const navigationBarHeight = useNavigationBarHeight()

  return (
    <View
      style={[styles.container, { paddingBottom: BASE_PADDING_BOTTOM + navigationBarHeight }]}
      nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}
    >
      <PlayInfo />
      <ControlBtn />
      <MoreBtn />
    </View>
  )
})

const styles = createStyle({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#131419',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'column',
    zIndex: 30,
  },
})
