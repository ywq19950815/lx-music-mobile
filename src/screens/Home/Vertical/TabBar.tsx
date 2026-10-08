import { memo, useRef, useEffect, useCallback } from 'react'
import { TouchableOpacity, View, StyleSheet, Animated, Easing } from 'react-native'
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
import { colors, motion } from '@/theme/tokens'
import PlayQueueDrawer, { type PlayQueueDrawerType } from '@/components/player/PlayQueueDrawer'
import { toast } from '@/utils/tools'
import { navigations } from '@/navigation'

/**
 * 底部导航项配置（发现 / 歌单 / 排行榜 / 我的）
 * 图标语义：发现=放大镜，歌单=唱片/专辑，排行榜=榜单，我的=人像
 */
const TAB_META: Record<string, { icon: string; label: string }> = {
  nav_search: { icon: 'search-2', label: '发现' },
  nav_songlist: { icon: 'album', label: '歌单' },
  nav_top: { icon: 'leaderboard', label: '排行榜' },
  nav_love: { icon: 'user', label: '我的' },
}

const TABS: Array<{ id: CommonState['navActiveId']; icon: string; label: string }> =
  indexMap.map(id => ({ id, ...TAB_META[id] }))

const TAB_ROW_HEIGHT = 60
const MINI_ROW_HEIGHT = 64

/** 按压弹簧缩放 Hook */
const usePressScale = () => {
  const scale = useRef(new Animated.Value(1)).current
  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.86,
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

/**
 * 单个圆形按压按钮
 */
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
 * 浮动迷你播放器（设计稿黑胶台入口）：
 * - 悬浮于底部导航之上的独立圆角卡片（毛玻璃白底 + hairline 边框 + 轻投影）
 * - 左侧 40px 旋转黑胶封面（播放时 10s/圈匀速自转，暂停即停）
 * - 中部歌名 + 品牌绿副标题「沉浸播放中 · 点击展开黑胶台」
 * - 右侧两枚圆钮：播放/暂停（品牌绿）+ 播放队列（弱底）
 */
const MiniPlayerCard = ({ onOpenList }: { onOpenList: () => void }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const hasTrack = !!musicInfo.id
  const hasTempTrack = playerState.tempPlayList.length > 0

  // ── 黑胶封面匀速旋转（暂停冻结在当前角度）──────────
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
          duration: 10000,
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

  return (
    <View style={styles.miniRow} pointerEvents="box-none">
      <TouchableOpacity style={styles.miniCard} activeOpacity={0.9} onPress={handleOpenPlayDetail}>
        {/* 左侧旋转黑胶封面 */}
        <View style={styles.miniCoverWrap}>
          <Animated.View style={[styles.miniCoverBorder, { transform: [{ rotate: coverSpin }] }]}>
            {musicInfo.pic
              ? <Image source={{ uri: musicInfo.pic }} style={styles.miniCover} />
              : <View style={[styles.miniCover, styles.miniCoverFallback]}><Icon name="logo" size={16} color="#FFFFFF" /></View>}
          </Animated.View>
        </View>

        {/* 中部歌曲信息 */}
        <View style={styles.miniCenter}>
          <Text style={styles.miniSongName} numberOfLines={1}>{hasTrack ? musicInfo.name : '暂无播放歌曲'}</Text>
          <Text style={styles.miniSubtitle} numberOfLines={1}>
            {hasTrack ? '沉浸播放中 · 点击展开黑胶台' : '点击选择歌曲播放'}
          </Text>
        </View>

        {/* 右侧控制圆钮 */}
        <View style={styles.miniRight}>
          <ScaleBtn onPress={handleTogglePlay} testID="tabbar-toggle">
            <View style={[styles.miniToggleBtn, !hasTrack && styles.miniToggleBtnDisabled]}>
              <Icon name={isPlay ? 'pause' : 'play'} color="#FFFFFF" size={14} />
            </View>
          </ScaleBtn>
          <ScaleBtn onPress={onOpenList} testID="tabbar-list">
            <View style={styles.miniActionBtn}>
              <Icon name="list-order" color={colors.inkSecondary} size={15} />
              {hasTempTrack && <View style={styles.queueDot} />}
            </View>
          </ScaleBtn>
        </View>
      </TouchableOpacity>
    </View>
  )
}

/**
 * 底部导航栏（设计稿规范）：
 * - 迷你播放器以独立浮动卡片悬于导航条上方（页面底色透出，营造悬浮感）
 * - 导航条：60px 白底 + 顶部 hairline，发现 / 音乐馆 / 我的 三 Tab
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
                <Icon name={icon} size={20} color={active ? colors.brand : colors.inkTertiary} />
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
  },
  // ===== 浮动迷你播放器 =====
  miniRow: {
    height: MINI_ROW_HEIGHT,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  miniCard: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 10,
  },
  miniCoverWrap: {
    marginRight: 10,
  },
  miniCoverBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  miniCover: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
  },
  miniCoverFallback: {
    backgroundColor: colors.night,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCenter: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  miniSongName: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 12.5,
  },
  miniSubtitle: {
    color: colors.brand,
    fontWeight: '500',
    fontSize: 11,
    marginTop: 2,
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
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  miniToggleBtnDisabled: {
    backgroundColor: '#C8CDD4',
    shadowOpacity: 0,
  },
  miniActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  queueDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand,
  },
  // ===== Tab 行 =====
  tabRow: {
    height: TAB_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  tab: {
    flex: 1,
    height: TAB_ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  iconBox: {
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: colors.brand,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: colors.inkTertiary,
    fontWeight: '500',
  },
})
