import { memo, useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { View, AppState, Animated, PanResponder } from 'react-native'

import Header from './components/Header'
import Player from './Player'
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view'
import Pic from './Pic'
import Lyric from './Lyric'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { useNavigationBarHeight } from '@/store/common/hook'
import { useWindowSize } from '@/utils/hooks'
import { pop } from '@/navigation'
import { createStyle } from '@/utils/tools'
import { motion } from '@/theme/tokens'

// 封面/歌词区域要给底部播放控制条让出的高度（沉浸式下还要再加系统手势条高度）
const PAGER_BOTTOM_PADDING = 155

const LyricPage = ({ activeIndex }: { activeIndex: number }) => {
  const initedRef = useRef(false)
  const lyric = useMemo(() => <Lyric />, [])
  switch (activeIndex) {
    case 1:
      if (!initedRef.current) initedRef.current = true
      return lyric
    default:
      return initedRef.current ? lyric : null
  }
}

export default memo(({ componentId }: { componentId: string }) => {
  const [pageIndex, setPageIndex] = useState(0)
  const showLyricRef = useRef(false)
  const navigationBarHeight = useNavigationBarHeight()
  const { height: winHeight } = useWindowSize()

  const onPageSelected = ({ nativeEvent }: PagerViewOnPageSelectedEvent) => {
    setPageIndex(nativeEvent.position)
    showLyricRef.current = nativeEvent.position == 1
    if (showLyricRef.current) {
      screenkeepAwake()
    } else {
      screenUnkeepAwake()
    }
  }

  // ── QQ 音乐式下拉关闭手势 ──────────────────────────────
  // 作用于封面页：向下拖动整页跟手位移，超过阈值或快速下滑即关闭
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

  return (
    // QQ 音乐式深色沉浸：整页（含 Header）统一坐在深空底上；
    // 根容器跟随下拉手势位移，整页跟手下坠
    <Animated.View style={[styles.root, { transform: [{ translateY: panY }] }]}>
      <Header />
      <View style={styles.container}>
        <PagerView
          onPageSelected={onPageSelected}
          style={[styles.pagerView, { paddingBottom: PAGER_BOTTOM_PADDING + navigationBarHeight }]}
        >
          <View collapsable={false} style={{ flex: 1, minHeight: 0 }} {...panResponder.panHandlers}>
            <Pic componentId={componentId} />
          </View>
          <View collapsable={false} style={{ flex: 1, minHeight: 0 }}>
            <LyricPage activeIndex={pageIndex} />
          </View>
        </PagerView>

        {/* 封面/歌词页面指示点 */}
        <View style={[styles.pageIndicator, { bottom: PAGER_BOTTOM_PADDING + navigationBarHeight - 12 }]} pointerEvents="none">
          <View style={[styles.pageIndicatorItem, pageIndex === 0 ? styles.pageDotActive : styles.pageDotIdle]} />
          <View style={[styles.pageIndicatorItem, pageIndex === 1 ? styles.pageDotActive : styles.pageDotIdle]} />
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
  pagerView: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  pageIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  pageIndicatorItem: {
    height: 4,
    borderRadius: 2,
  },
  pageDotActive: {
    width: 14,
    backgroundColor: '#F5A623',
  },
  pageDotIdle: {
    width: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
})
