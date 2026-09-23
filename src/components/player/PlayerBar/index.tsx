import { memo } from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'
import { useKeyboard } from '@/utils/hooks'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'

import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { useSettingValue } from '@/store/setting/hook'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

/**
 * NeoPlayerBar: 新粗野主义悬浮全局播放条。
 * - 纯黑 2.5px 实体边框
 * - 纯黑硬边物理投影（Hard Offset Shadow）
 * - 亮黄/电光粉波普强调色
 */
export default memo(({ isHome = false }: { isHome?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')

  if (autoHidePlayBar && keyboardShown) return null

  const handleOpenPlayDetail = () => {
    navigations.pushPlayDetailScreen(commonState.componentIds.home || 'home')
    if (typeof window !== 'undefined' && (window as any).__lxTogglePlayDetail) {
      (window as any).__lxTogglePlayDetail(true)
    }
    globalThis.app_event?.emit('openPlayDetail')
  }

  return (
    <View style={styles.outerWrapper}>
      {/* 背后纯黑实体硬投影底座 */}
      <View style={styles.hardShadowUnderlay} />

      {/* 悬浮前台卡片 */}
      <View style={styles.cardContainer}>
        {/* 左侧及中间主要区域：点击整条区域均可直接打开全屏播放详情页 */}
        <TouchableOpacity
          testID="player-bar-card"
          style={styles.clickableArea}
          onPress={handleOpenPlayDetail}
          activeOpacity={0.75}
        >
          <Pic isHome={isHome} />
          <View style={styles.center}>
            <Title isHome={isHome} />
            <PlayInfo isHome={isHome} />
          </View>
        </TouchableOpacity>

        <View style={styles.right}>
          <ControlBtn />
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    paddingHorizontal: 12,
    // 上方留白：与页面内容拉开距离，避免播放条与列表最后一项贴死
    paddingTop: 6,
    // 下方留白：与底部导航之间留出呼吸空间，避免两条黑边紧贴显得拥挤
    paddingBottom: 10,
    position: 'relative',
  },
  // 纯黑硬投影底座
  hardShadowUnderlay: {
    position: 'absolute',
    left: 15,
    right: 9,
    top: 9,
    bottom: 7,
    backgroundColor: neoColors.black,
    borderRadius: neoBorders.radiusMd,
    zIndex: 0,
  },
  // 前景主体卡片
  cardContainer: {
    width: '100%',
    paddingVertical: 7,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: neoBorders.radiusMd,
    backgroundColor: neoColors.white,
    borderWidth: neoBorders.regular,
    borderColor: neoColors.black,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  clickableArea: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 10,
    height: '100%',
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingLeft: 4,
    paddingRight: 2,
  },
})
