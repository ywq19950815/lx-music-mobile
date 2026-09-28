import { memo, useRef, useEffect, useCallback } from 'react'
import { View, AppState, Animated, PanResponder } from 'react-native'

import Header from './components/Header'
import Player from './Player'
import Pic from './Pic'
import Lyric from './Lyric'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { useNavigationBarHeight } from '@/store/common/hook'
import { useWindowSize } from '@/utils/hooks'
import { pop } from '@/navigation'
import { createStyle } from '@/utils/tools'
import { motion } from '@/theme/tokens'
import { PIC_AREA_RATIO, LYRIC_BOTTOM_INSET } from './constant'

/**
 * QQ 音乐式同屏布局：上半黑胶唱机（含唱针）+ 下半同步滚动歌词，
 * 底部沉浸控制面板。整页支持下拉关闭手势（作用于唱片区）。
 */
export default memo(({ componentId }: { componentId: string }) => {
  const showLyricRef = useRef(true)
  const navigationBarHeight = useNavigationBarHeight()
  const { height: winHeight } = useWindowSize()

  const picAreaHeight = Math.round(Math.min(winHeight * PIC_AREA_RATIO, 420))

  // 歌词页常显，保持屏幕常亮
  useEffect(() => {
    screenkeepAwake()
    return () => {
      screenUnkeepAwake()
    }
  }, [])

  useEffect(() => {
    let appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          if (showLyricRef.current && !commonState.componentIds.comment) screenkeepAwake()
          break
        case 'background':
          screenUnkeepAwake()
          break
      }
    })

    const handleComponentIdsChange = (ids: CommonState['componentIds']) => {
      if (ids.comment) screenUnkeepAwake()
      else if (AppState.currentState == 'active') screenkeepAwake()
    }

    global.state_event.on('componentIdsUpdated', handleComponentIdsChange)

    return () => {
      global.state_event.off('componentIdsUpdated', handleComponentIdsChange)
      appstateListener.remove()
      screenUnkeepAwake()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── QQ 音乐式下拉关闭手势 ──────────────────────────────
  // 作用于封面区域：向下拖动整页跟手位移，超过阈值或快速下滑即关闭
  const panY = useRef(new Animated.Value(0)).current

  const handleClose = useCallback(() => {
    void pop(commonState.componentIds.playDetail!)
    globalThis.app_event?.emit('closePlayDetail')
    if (typeof window !== 'undefined' && (window as any).__lxTogglePlayDetail) {
      (window as any).__lxTogglePlayDetail(false)
    }
  }, [])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        g.numberActiveTouches === 1 && g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 110 || g.vy > 0.6) {
          Animated.timing(panY, {
            toValue: winHeight,
            duration: 220,
            useNativeDriver: false,
          }).start(() => {
            handleClose()
            panY.setValue(0)
          })
        } else {
          Animated.spring(panY, {
            toValue: 0,
            friction: motion.spring.friction,
            tension: motion.spring.tension,
            useNativeDriver: false,
          }).start()
        }
      },
    }),
  ).current
  // ─────────────────────────────────────────────────────

  return (
    // QQ 音乐式深色沉浸：整页（含 Header）统一坐在深空底上；
    // 根容器跟随下拉手势位移，整页跟手下坠
    <Animated.View style={[styles.root, { transform: [{ translateY: panY }] }]}>
      <Header />
      <View style={styles.container}>
        {/* 上半：黑胶唱机（下拉关闭手势热区） */}
        <View style={[styles.picArea, { height: picAreaHeight }]} {...panResponder.panHandlers}>
          <Pic componentId={componentId} />
        </View>

        {/* 下半：同步滚动歌词（逐字卡拉OK） */}
        <View style={[styles.lyricArea, { paddingBottom: LYRIC_BOTTOM_INSET + navigationBarHeight }]}>
          <Lyric />
        </View>

        <Player />
      </View>
    </Animated.View>
  )
})

const styles = createStyle({
  root: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
    backgroundColor: '#131419',
  },
  container: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
    backgroundColor: '#131419',
    overflow: 'hidden',
    position: 'relative',
  },
  picArea: {
    minHeight: 0,
  },
  lyricArea: {
    flex: 1,
    minHeight: 0,
  },
})
