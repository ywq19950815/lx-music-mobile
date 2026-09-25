import { memo, useRef, useCallback } from 'react'
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native'
import { useKeyboard } from '@/utils/hooks'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { useProgress } from '@/store/player/hook'

import Pic from './components/Pic'
import Title from './components/Title'
import ControlBtn from './components/ControlBtn'
import { useSettingValue } from '@/store/setting/hook'
import { useNavigationBarHeight } from '@/store/common/hook'
import { motion } from '@/theme/tokens'

const BAR_HEIGHT = 56
const BASE_PADDING_BOTTOM = 6

/**
 * 迷你播放条：QQ 音乐式精致悬浮胶囊。
 * - 纯白圆角胶囊 + 双层柔和弥散软阴影
 * - 顶部极细品牌金流光进度条（高度 1.5px）
 * - 按压 spring 缩放反馈
 * - 黑胶唱片微浮动旋转 + 歌名/歌手清爽单行排版 + 纯圆金白控制按键
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
      toValue: 0.98,
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
          {/* 顶部流金进度细线 */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>

          {/* 左侧精致黑胶唱片 */}
          <Pic isHome={isHome} />

          {/* 中间核心歌曲信息 */}
          <View style={styles.center}>
            <Title isHome={isHome} />
          </View>

          {/* 右侧控制区 */}
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
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  barBox: {
    width: '100%',
    height: BAR_HEIGHT,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFF0F3',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  // 进度细线轨道（顶部通栏）
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F5A623',
  },
  center: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 6,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
})
