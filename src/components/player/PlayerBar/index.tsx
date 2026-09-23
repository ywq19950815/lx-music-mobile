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
import { useNavigationBarHeight } from '@/store/common/hook'
import { neoColors, neoBorders } from '@/theme/neobrutalism'
import { scaleSizeH } from '@/utils/pixelRatio'

const BAR_HEIGHT = scaleSizeH(64)
const BASE_PADDING_BOTTOM = 8

/**
 * NeoPlayerBar: 新粗野主义悬浮全局播放条。
 * - 纯黑 2.5px 实体边框
 * - 纯黑硬边物理投影（Hard Offset Shadow）
 * - 亮黄/电光粉波普强调色
 * - 定高胶囊设计，根绝 Yoga 引擎在百分比高度下的布局爆展
 *
 * isHome=true 时它坐在底部 TabBar 之上（TabBar 已负责让出手势条高度），
 * 其余场景（歌单详情页等）它就是页面最底部，必须自己让出底部系统栏高度。
 */
export default memo(({ isHome = false }: { isHome?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const navigationBarHeight = useNavigationBarHeight()

  if (autoHidePlayBar && keyboardShown) return null

  const handleOpenPlayDetail = () => {
    navigations.pushPlayDetailScreen(commonState.componentIds.home || 'home')
    if (typeof window !== 'undefined' && (window as any).__lxTogglePlayDetail) {
      (window as any).__lxTogglePlayDetail(true)
    }
    globalThis.app_event?.emit('openPlayDetail')
  }

  return (
    <View
      style={[
        styles.outerWrapper,
        { paddingBottom: BASE_PADDING_BOTTOM + (isHome ? 0 : navigationBarHeight) },
      ]}
    >
      <View style={styles.barBox}>
        {/* 背后纯黑实体硬投影底座：严格对齐卡片宽高，偏移 (+3, +3) */}
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
    </View>
  )
})

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    paddingHorizontal: 12,
    // 上方留白：与页面内容拉开距离，避免播放条与列表最后一项贴死
    paddingTop: 4,
    // 下方留白（含底部系统栏高度）按场景动态计算，见组件内的 paddingBottom
  },
  barBox: {
    width: '100%',
    height: BAR_HEIGHT,
    position: 'relative',
  },
  // 纯黑硬投影底座：严格对齐卡片宽高，偏移 (+3, +3)
  hardShadowUnderlay: {
    position: 'absolute',
    left: 3,
    top: 3,
    right: 0,
    bottom: 0,
    backgroundColor: neoColors.black,
    borderRadius: neoBorders.radiusMd,
    zIndex: 0,
  },
  // 前景主体卡片：左上基准 (0, 0)，宽高与投影完全一致
  cardContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 3,
    bottom: 3,
    paddingHorizontal: 8,
    borderRadius: neoBorders.radiusMd,
    backgroundColor: neoColors.white,
    borderWidth: neoBorders.regular,
    borderColor: neoColors.black,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 1,
  },
  clickableArea: {
    flex: 1,
    height: '100%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    paddingLeft: 10,
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
