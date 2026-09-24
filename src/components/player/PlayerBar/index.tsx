import { memo, useRef, useCallback } from 'react'
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native'
import { useKeyboard } from '@/utils/hooks'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { useProgress } from '@/store/player/hook'

import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { useSettingValue } from '@/store/setting/hook'
import { useNavigationBarHeight } from '@/store/common/hook'
import { softShadow, motion } from '@/theme/tokens'
import { scaleSizeH } from '@/utils/pixelRatio'

const BAR_HEIGHT = scaleSizeH(64)
const BASE_PADDING_BOTTOM = 8

/**
 * 迷你播放条：QQ 音乐式悬浮胶囊。
 * - 白底圆角胶囊 + 弥散软阴影（无描边、无硬底座）
 * - 顶部 2px 品牌金进度细线（QQ 音乐标志性细节）
 * - 按压 spring 缩放反馈
 * - 定高设计，根绝 Yoga 百分比高度布局爆展
 *
 * isHome=true 时坐在底部 TabBar 之上（TabBar 已让出手势条高度）；
 * 其余场景自己是页面最底部，需让出底部系统栏高度。
 */
export default memo(({ isHome = false }: { isHome?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const navigationBarHeight = useNavigationBarHeight()
  const { progress } = useProgress()

  // 按压 spring 缩放
  const pressAnim = useRef(new Animated.Value(1)).current
  const pressIn = useCallback(() => {
    Animated.spring(pressAnim, {
      toValue: 0.97,
      friction: motion.spring.friction,
      tension: motion.spring.tension,
      useNativeDriver: true,
    }).start()
  }, [pressAnim])
  const pressOut = useCallback(() => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: motion.spring.friction,
      tension: motion.spring.tension,
      useNativeDriver: true,
    }).start()
  }, [pressAnim])

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
      <Animated.View style={[styles.barBox, { transform: [{ scale: pressAnim }] }]}>
        <TouchableOpacity
          testID="player-bar-card"
          style={styles.cardContainer}
          onPress={handleOpenPlayDetail}
          onPressIn={pressIn}
          onPressOut={pressOut}
          activeOpacity={1}
        >
          {/* 顶部进度细线：QQ 音乐标志性细节 */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>

          <Pic isHome={isHome} />
          <View style={styles.center}>
            <Title isHome={isHome} />
            <PlayInfo isHome={isHome} />
          </View>
          <View style={styles.right}>
            <ControlBtn />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
})

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  barBox: {
    width: '100%',
    height: BAR_HEIGHT,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...softShadow('md'),
  },
  // 进度细线轨道（顶部通栏）
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(245,166,35,0.15)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 1,
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
