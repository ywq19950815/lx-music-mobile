import { memo, useRef, useEffect, useState, useCallback } from 'react'
import { View, AppState, Animated, PanResponder, TouchableOpacity } from 'react-native'
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view'

import Header from './components/Header'
import Player from './Player'
import Pic from './Pic'
import Lyric from './Lyric'
import PlayQueueDrawer from '@/components/player/PlayQueueDrawer'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { useNavigationBarHeight } from '@/store/common/hook'
import { useWindowSize } from '@/utils/hooks'
import { pop } from '@/navigation'
import { createStyle } from '@/utils/tools'
import { motion, useAppColors } from '@/theme/tokens'
import { PIC_AREA_RATIO } from './constant'

/**
 * QQ 音乐式双层播放交互系统（2026-09-29 设计稿：浅色黑胶台 / 深色双主题）：
 * - Page 0（主视图）：上半黑胶唱机 + 下半同步滚动歌词（轻触歌词可快速平滑进入全屏大歌词）
 * - Page 1（全屏歌词）：沉浸式大屏卡拉OK滚动歌词，逐字染色，向右滑回唱机页
 * - 页面微型指示器：指示当前视图（唱机/歌词），支持点击切换
 * - 下拉关闭手势：在唱机区域跟手下坠，超过阈值关闭播放详情
 */
export default memo(({ componentId }: { componentId: string }) => {
  const showLyricRef = useRef(true)
  const pagerRef = useRef<PagerView>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const navigationBarHeight = useNavigationBarHeight()
  const c = useAppColors()
  const { width: winWidth, height: winHeight } = useWindowSize()

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

  // ── QQ 音乐式下拉关闭 + 左边缘向右侧滑关闭手势 ──────────────────────────────
  const panY = useRef(new Animated.Value(0)).current
  const panX = useRef(new Animated.Value(0)).current
  const gestureMode = useRef<'vertical' | 'horizontal' | null>(null)
  const isClosingRef = useRef(false)

  const handleClose = useCallback(() => {
    const compId = componentId ?? commonState.componentIds.playDetail
    if (compId) void pop(compId)
    global.app_event?.closePlayDetail?.()
    if ((globalThis as any).__lxTogglePlayDetail) {
      (globalThis as any).__lxTogglePlayDetail(false)
    }
  }, [componentId])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_e, g) => {
        if (g.numberActiveTouches !== 1 || isClosingRef.current) return false
        // 1. 下拉关闭手势
        if (g.dy > 10 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5) {
          gestureMode.current = 'vertical'
          return true
        }
        // 2. 左边缘向右侧滑关闭手势（左侧 70dp 内触摸起步）
        if (g.x0 <= 70 && g.dx > 10 && g.dx > Math.abs(g.dy) * 1.5) {
          gestureMode.current = 'horizontal'
          return true
        }
        return false
      },
      onMoveShouldSetPanResponder: (_e, g) => {
        if (g.numberActiveTouches !== 1 || isClosingRef.current) return false
        if (g.dy > 10 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5) {
          gestureMode.current = 'vertical'
          return true
        }
        if (g.x0 <= 70 && g.dx > 10 && g.dx > Math.abs(g.dy) * 1.5) {
          gestureMode.current = 'horizontal'
          return true
        }
        return false
      },
      onPanResponderMove: (_e, g) => {
        if (gestureMode.current === 'vertical') {
          panY.setValue(Math.max(0, g.dy))
        } else if (gestureMode.current === 'horizontal') {
          panX.setValue(Math.max(0, g.dx))
        }
      },
      onPanResponderRelease: (_e, g) => {
        if (gestureMode.current === 'vertical') {
          if (g.dy > 110 || g.vy > 0.6) {
            isClosingRef.current = true
            Animated.timing(panY, {
              toValue: winHeight,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              handleClose()
              panY.setValue(0)
              isClosingRef.current = false
            })
          } else {
            Animated.spring(panY, {
              toValue: 0,
              friction: motion.spring.friction,
              tension: motion.spring.tension,
              useNativeDriver: true,
            }).start()
          }
        } else if (gestureMode.current === 'horizontal') {
          const threshold = winWidth * 0.22
          if (g.dx > threshold || g.vx > 0.4) {
            isClosingRef.current = true
            Animated.timing(panX, {
              toValue: winWidth,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              handleClose()
              panX.setValue(0)
              isClosingRef.current = false
            })
          } else {
            Animated.spring(panX, {
              toValue: 0,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }).start()
          }
        }
        gestureMode.current = null
      },
      onPanResponderTerminate: () => {
        if (gestureMode.current === 'vertical') {
          Animated.spring(panY, {
            toValue: 0,
            friction: motion.spring.friction,
            tension: motion.spring.tension,
            useNativeDriver: true,
          }).start()
        } else if (gestureMode.current === 'horizontal') {
          Animated.spring(panX, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start()
        }
        gestureMode.current = null
      },
    }),
  ).current

  const onPageSelected = useCallback((e: PagerViewOnPageSelectedEvent) => {
    setCurrentPage(e.nativeEvent.position)
  }, [])

  const handleSwitchPage = (target: number) => {
    pagerRef.current?.setPage(target)
    setCurrentPage(target)
  }

  return (
    <Animated.View style={[styles.root, { backgroundColor: c.canvas, transform: [{ translateX: panX }, { translateY: panY }] }]} {...panResponder.panHandlers}>
      <Header componentId={componentId} />

      <View style={[styles.container, { backgroundColor: c.canvas }]}>
        {/* 滑动翻页系统：Page 0 唱机同屏 + Page 1 全屏歌词 */}
        <PagerView
          ref={pagerRef}
          initialPage={0}
          onPageSelected={onPageSelected}
          style={styles.pagerView}
        >
          {/* ── Page 0：黑胶唱机 + 同屏伴随歌词 ── */}
          <View key="page_pic" style={styles.pageWrap}>
            <View style={[styles.picArea, { height: picAreaHeight }]} {...panResponder.panHandlers}>
              <Pic componentId={componentId} />
            </View>

            {/* 点击下方同屏歌词，可直接平滑滑到全屏大歌词页 */}
            <TouchableOpacity
              style={styles.halfLyricArea}
              activeOpacity={0.92}
              onPress={() => handleSwitchPage(1)}
            >
              <Lyric variant="half" />
            </TouchableOpacity>
          </View>

          {/* ── Page 1：全屏大歌词（带卡拉OK逐字变色，沉浸大字） ── */}
          <View key="page_lyric" style={styles.pageWrap}>
            <View style={styles.fullLyricArea}>
              <Lyric variant="full" />
            </View>
          </View>
        </PagerView>

        {/* 页面微型指示器（左右可滑提示，点击可直接切页） */}
        <View style={styles.indicatorRow}>
          <TouchableOpacity
            style={[styles.dotBtn, currentPage === 0 ? styles.dotActive : styles.dotIdle, { backgroundColor: currentPage === 0 ? c.brand : c.hairline }]}
            onPress={() => handleSwitchPage(0)}
            activeOpacity={0.7}
          />
          <TouchableOpacity
            style={[styles.dotBtn, currentPage === 1 ? styles.dotActive : styles.dotIdle, { backgroundColor: currentPage === 1 ? c.brand : c.hairline }]}
            onPress={() => handleSwitchPage(1)}
            activeOpacity={0.7}
          />
        </View>

        {/* 底部沉浸播放控制条 */}
        <View style={{ paddingBottom: navigationBarHeight }}>
          <Player />
        </View>

        {/* 沉浸式播放队列抽屉 */}
        <PlayQueueDrawer />
      </View>
    </Animated.View>
  )
})

const styles = createStyle({
  root: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
  },
  container: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  pagerView: {
    flex: 1,
    minHeight: 0,
  },
  pageWrap: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
  },
  picArea: {
    minHeight: 0,
  },
  halfLyricArea: {
    flex: 1,
    minHeight: 0,
  },
  fullLyricArea: {
    flex: 1,
    minHeight: 0,
    paddingTop: 10,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  dotBtn: {
    width: 14,
    height: 3.5,
    borderRadius: 2,
  },
  dotActive: {
    width: 18,
  },
  dotIdle: {},
})
