import { memo, useRef, useEffect, useState, useCallback } from 'react'
import { View, AppState, Animated, PanResponder, TouchableOpacity, StyleSheet } from 'react-native'
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
import { motion, colors } from '@/theme/tokens'
import { PIC_AREA_RATIO } from './constant'

/**
 * QQ 音乐式双层播放交互系统：
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

  const onPageSelected = useCallback((e: PagerViewOnPageSelectedEvent) => {
    setCurrentPage(e.nativeEvent.position)
  }, [])

  const handleSwitchPage = (target: number) => {
    pagerRef.current?.setPage(target)
    setCurrentPage(target)
  }

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: panY }] }]}>
      <Header />

      <View style={styles.container}>
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
              <Lyric />
            </TouchableOpacity>
          </View>

          {/* ── Page 1：全屏大歌词（带卡拉OK逐字变色，沉浸大字） ── */}
          <View key="page_lyric" style={styles.pageWrap}>
            <View style={styles.fullLyricArea}>
              <Lyric />
            </View>
          </View>
        </PagerView>

        {/* 页面微型指示器（左右可滑提示，点击可直接切页） */}
        <View style={styles.indicatorRow}>
          <TouchableOpacity
            style={[styles.dotBtn, currentPage === 0 ? styles.dotActive : styles.dotIdle]}
            onPress={() => handleSwitchPage(0)}
            activeOpacity={0.7}
          />
          <TouchableOpacity
            style={[styles.dotBtn, currentPage === 1 ? styles.dotActive : styles.dotIdle]}
            onPress={() => handleSwitchPage(1)}
            activeOpacity={0.7}
          />
        </View>

        {/* 底部沉浸播放控制条 */}
        <View style={{ paddingBottom: navigationBarHeight }}>
          <Player />
        </View>

        {/* 沉浸式暗色播放队列抽屉 */}
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
    backgroundColor: colors.brand,
    width: 18,
  },
  dotIdle: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
})
