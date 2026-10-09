import { memo, useRef, useEffect, useCallback } from 'react'
import { TouchableOpacity, View, StyleSheet, Animated, Easing, Platform } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { Image } from 'react-native'
import { useNavActiveId, useNavigationBarHeight } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import type { InitState as CommonState } from '@/store/common/state'
import { indexMap } from './Main'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { togglePlay } from '@/core/player/player'
import playerState from '@/store/player/state'
import commonState from '@/store/common/state'
import { colors, motion, radius } from '@/theme/tokens'
import PlayQueueDrawer, { type PlayQueueDrawerType } from '@/components/player/PlayQueueDrawer'
import { toast } from '@/utils/tools'
import { navigations } from '@/navigation'

/**
 * 底部导航项配置（发现 / 歌单 / 排行榜 / 我的）
 */
const TAB_META: Record<string, { icon: string; label: string }> = {
  nav_search: { icon: 'search-2', label: '发现' },
  nav_songlist: { icon: 'album', label: '歌单' },
  nav_top: { icon: 'leaderboard', label: '排行榜' },
  nav_love: { icon: 'user', label: '我的' },
}

const TABS: Array<{ id: CommonState['navActiveId']; icon: string; label: string }> =
  indexMap.map(id => ({ id, ...TAB_META[id] }))

const TAB_ROW_HEIGHT = 56
const MINI_ROW_HEIGHT = 62

/** 按压弹簧缩放 Hook */
const usePressScale = () => {
  const scale = useRef(new Animated.Value(1)).current
  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.88,
      friction: motion.spring.friction,
      tension: motion.spring.tension,
      useNativeDriver: true,
    }).start()
  }, [scale])
  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: motion.spring.friction,
      tension: motion.spring.tension,
      useNativeDriver: true,
    }).start()
  }, [scale])
  return { scale, onPressIn, onPressOut }
}

/** 单个圆形按压按钮 */
const ScaleBtn = ({ onPress, children, testID }: {
  onPress: () => void
  children: React.ReactNode
  testID?: string
}) => {
  const { scale, onPressIn, onPressOut } = usePressScale()
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.7}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.scaleBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  )
}

/**
 * 浮动迷你播放胶囊（深度对标 QQ 音乐规范）：
 * 1. 极致饱满的半圆药丸胶囊（borderRadius: 27）
 * 2. 曜黑黑胶微刻线封面（匀速平滑自转 + 金色转轴孔）
 * 3. 真实歌手元数据排版（不再是死板广告语）
 * 4. QQ 音乐品牌绿高质感实心播放圆钮 + 柔和浅灰队列圆钮
 */
const MiniPlayerCard = ({ onOpenList }: { onOpenList: () => void }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const hasTrack = !!musicInfo.id
  const hasTempTrack = playerState.tempPlayList.length > 0

  // ── 黑胶封面匀速旋转 ─────────────────────────────
  const rotateAnim = useRef(new Animated.Value(0)).current
  const currentAngle = useRef(0)
  const animRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    const listenerId = rotateAnim.addListener(({ value }) => { currentAngle.current = value })
    return () => { rotateAnim.removeListener(listenerId) }
  }, [rotateAnim])

  useEffect(() => {
    if (isPlay) {
      const remaining = 1 - (currentAngle.current % 1)
      animRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: currentAngle.current + remaining + 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      )
      animRef.current.start()
    } else {
      animRef.current?.stop()
      rotateAnim.stopAnimation((value) => { currentAngle.current = value })
    }
    return () => { animRef.current?.stop() }
  }, [isPlay, rotateAnim])

  const coverSpin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  const handleOpenPlayDetail = () => {
    if (!hasTrack) {
      toast('当前没有正在播放的歌曲')
      return
    }
    navigations.pushPlayDetailScreen(commonState.componentIds.home || 'home')
    if ((globalThis as any).__lxTogglePlayDetail) {
      (globalThis as any).__lxTogglePlayDetail(true)
    }
  }

  const handleTogglePlay = () => {
    if (!hasTrack) {
      toast('当前没有正在播放的歌曲')
      return
    }
    togglePlay()
  }

  // 真实歌手元数据副标题
  const singerDesc = hasTrack
    ? (musicInfo.singer || '高清无损音质')
    : '选择喜欢的音乐播放'

  return (
    <View style={styles.miniRow} pointerEvents="box-none">
      <TouchableOpacity style={styles.miniCard} activeOpacity={0.92} onPress={handleOpenPlayDetail}>
        {/* 左侧曜黑旋转黑胶唱盘 */}
        <View style={styles.miniCoverWrap}>
          <Animated.View style={[styles.vinylRecord, { transform: [{ rotate: coverSpin }] }]}>
            {musicInfo.pic ? (
              <Image source={{ uri: musicInfo.pic }} style={styles.miniCover} />
            ) : (
              <View style={[styles.miniCover, styles.miniCoverFallback]}>
                <Icon name="logo" size={15} color="#FFFFFF" />
              </View>
            )}
            {/* 黑胶黄铜轴心微孔 */}
            <View style={styles.vinylCenterHole} />
          </Animated.View>
        </View>

        {/* 中部歌曲与真实歌手信息 */}
        <View style={styles.miniCenter}>
          <Text style={styles.miniSongName} numberOfLines={1}>
            {hasTrack ? musicInfo.name : '暂无播放歌曲'}
          </Text>
          <View style={styles.miniSubRow}>
            {isPlay ? (
              <View style={styles.playingDot} />
            ) : null}
            <Text style={[styles.miniSubtitle, isPlay && styles.miniSubtitleActive]} numberOfLines={1}>
              {singerDesc}
            </Text>
          </View>
        </View>

        {/* 右侧控制圆钮 */}
        <View style={styles.miniRight}>
          <ScaleBtn onPress={handleTogglePlay} testID="tabbar-toggle">
            <View style={[styles.miniToggleBtn, !hasTrack && styles.miniToggleBtnDisabled]}>
              <Icon name={isPlay ? 'pause' : 'play'} color="#FFFFFF" size={13} />
            </View>
          </ScaleBtn>
          <ScaleBtn onPress={onOpenList} testID="tabbar-list">
            <View style={styles.miniActionBtn}>
              <Icon name="list-order" color="#475569" size={15} />
              {hasTempTrack && <View style={styles.queueDot} />}
            </View>
          </ScaleBtn>
        </View>
      </TouchableOpacity>
    </View>
  )
}

/**
 * 底部导航栏与播放胶囊一体化系统：
 * 1. 顶部提供多层柔和羽化渐淡遮罩，消除上方内容滚下来时的生硬横切与割裂断层
 * 2. 胶囊与下方 Tab 栏浑然天成，彻底废除胶囊下方的横切黑线
 */
const TabBar = () => {
  const activeId = useNavActiveId()
  const navigationBarHeight = useNavigationBarHeight()
  const queueRef = useRef<PlayQueueDrawerType>(null)

  return (
    <View style={[
      styles.container,
      { height: MINI_ROW_HEIGHT + TAB_ROW_HEIGHT + navigationBarHeight, paddingBottom: navigationBarHeight },
    ]}>
      {/* 顶部柔和渐隐羽化层：使上方内容区域向下滚动时自然淡入，消除生硬横切硬断层 */}
      <View style={styles.topFadeContainer} pointerEvents="none">
        <View style={styles.fadeBar1} />
        <View style={styles.fadeBar2} />
        <View style={styles.fadeBar3} />
      </View>

      <MiniPlayerCard onOpenList={() => queueRef.current?.show()} />

      <View style={styles.tabRow}>
        {TABS.map(({ id, icon, label }) => {
          const active = activeId === id
          return (
            <TouchableOpacity
              key={id}
              style={styles.tab}
              activeOpacity={0.65}
              onPress={() => { setNavActiveId(id) }}
            >
              <View style={styles.iconBox}>
                <Icon name={icon} size={20} color={active ? colors.brand : '#94A3B8'} />
              </View>
              <Text style={[styles.tabLabel, active ? styles.tabLabelActive : styles.tabLabelInactive]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <PlayQueueDrawer ref={queueRef} />
    </View>
  )
}

export default memo(TabBar)

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    position: 'relative',
  },
  // ── 顶部向上渐隐羽化层 ────────────────────
  topFadeContainer: {
    position: 'absolute',
    top: -18,
    left: 0,
    right: 0,
    height: 18,
    flexDirection: 'column',
  },
  fadeBar1: {
    height: 5,
    backgroundColor: 'rgba(248, 250, 252, 0.15)',
  },
  fadeBar2: {
    height: 6,
    backgroundColor: 'rgba(248, 250, 252, 0.55)',
  },
  fadeBar3: {
    height: 7,
    backgroundColor: 'rgba(248, 250, 252, 0.92)',
  },

  // ── 浮动迷你播放胶囊 ──────────────────────
  miniRow: {
    height: MINI_ROW_HEIGHT,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  miniCard: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 26, // 极致饱满的半圆大胶囊形态
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },
  miniCoverWrap: {
    marginRight: 9,
  },
  vinylRecord: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#111827',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  miniCover: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  miniCoverFallback: {
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylCenterHole: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  miniCenter: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  miniSongName: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 17,
  },
  miniSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  playingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.brand,
    marginRight: 4,
  },
  miniSubtitle: {
    color: '#64748B',
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 15,
  },
  miniSubtitleActive: {
    color: '#475569',
  },
  miniRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    marginLeft: 6,
  },
  scaleBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  miniToggleBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  miniActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  queueDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.brand,
  },

  // ── 底部 TabBar 行（去除了横切生硬黑线） ────
  tabRow: {
    height: TAB_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F1F5F9',
  },
  tab: {
    flex: 1,
    height: TAB_ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  iconBox: {
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: colors.brand,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#94A3B8',
    fontWeight: '500',
  },
})
