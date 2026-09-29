import { memo, useRef, useState, useEffect, useCallback } from 'react'
import { TouchableOpacity, View, StyleSheet, Animated, FlatList } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { Image } from 'react-native'
import { useNavActiveId, useNavigationBarHeight } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import type { InitState as CommonState } from '@/store/common/state'
import { indexMap } from './Main'
import { usePlayerMusicInfo, useProgress, useIsPlay } from '@/store/player/hook'
import { collectMusic, uncollectMusic, togglePlay, playList, playNext } from '@/core/player/player'
import { removeTempPlayList } from '@/core/player/tempPlayList'
import playerState from '@/store/player/state'
import listState from '@/store/list/state'
import { LIST_IDS } from '@/config/constant'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { colors, motion, radius } from '@/theme/tokens'
import PlayQueueDrawer, { type PlayQueueDrawerType } from '@/components/player/PlayQueueDrawer'
import { getListMusics, getListMusicSync } from '@/utils/listManage'
import { toast } from '@/utils/tools'

/**
 * 底部导航项配置（QQ 音乐级精致图标 + 标贴体系）
 */
// 一级菜单已精简为三项：设置页移入「我的」二级菜单。
// 「我的」图标用唱片（album）代替爱心，避免与「我喜欢」混淆。
const TAB_META: Record<string, { icon: string; label: string }> = {
  nav_search: { icon: 'search-2', label: '发现' },
  nav_top: { icon: 'leaderboard', label: '排行榜' },
  nav_love: { icon: 'album', label: '我的' },
}

const TABS: Array<{ id: CommonState['navActiveId']; icon: string; label: string }> =
  indexMap.map(id => ({ id, ...TAB_META[id] }))

const TAB_ROW_HEIGHT = 52
const PLAY_ROW_HEIGHT = 56

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
 * 当前播放行：封面 + 歌曲信息 +（播放/暂停 / 喜欢 / 列表）三枚控制
 */
const NowPlayingRow = ({ onOpenList }: { onOpenList: () => void }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const { progress } = useProgress()
  const [isLove, setIsLove] = useState(false)

  const hasTrack = !!musicInfo.id
  const hasTempTrack = playerState.tempPlayList.length > 0

  // 实时计算当前歌曲是否已收藏到「我喜欢」（支持冷启动异步兜底与实时事件同步）
  useEffect(() => {
    let cancel = false
    const update = () => {
      if (!musicInfo.id) {
        setIsLove(false)
        return
      }
      const syncList = getListMusicSync(LIST_IDS.LOVE)
      if (syncList && syncList.length) {
        setIsLove(syncList.some(m => m.id === musicInfo.id))
      } else {
        void getListMusics(LIST_IDS.LOVE).then((list) => {
          if (!cancel) setIsLove(list.some(m => m.id === musicInfo.id))
        }).catch(() => {})
      }
    }
    update()
    global.state_event.on('playMusicInfoChanged', update)
    global.app_event.on('myListMusicUpdate', update)
    return () => {
      cancel = true
      global.state_event.off('playMusicInfoChanged', update)
      global.app_event.off('myListMusicUpdate', update)
    }
  }, [musicInfo.id])

  const handleOpenPlayDetail = () => {
    if (!hasTrack) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home || 'home')
    if (typeof window !== 'undefined' && (window as any).__lxTogglePlayDetail) {
      (window as any).__lxTogglePlayDetail(true)
    }
    globalThis.app_event?.emit('openPlayDetail')
  }

  const handleTogglePlay = () => {
    if (!hasTrack) {
      toast('当前没有正在播放的歌曲')
      return
    }
    togglePlay()
  }

  const handleToggleLove = () => {
    if (!hasTrack) {
      toast('当前没有正在播放的歌曲')
      return
    }
    if (isLove) {
      setIsLove(false)
      uncollectMusic()
      toast('已从「我喜欢」中移除')
    } else {
      setIsLove(true)
      collectMusic()
      toast('已添加到「我喜欢」')
    }
  }

  return (
    <View style={styles.playRow}>
      {/* 顶部极细进度流光线 */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
      </View>

      {/* 左侧圆形封面 */}
      <TouchableOpacity style={styles.coverWrap} onPress={handleOpenPlayDetail} activeOpacity={0.8}>
        {musicInfo.pic
          ? <Image source={{ uri: musicInfo.pic }} style={styles.cover} />
          : <View style={styles.coverFallback}><Icon name="logo" size={18} color="#FFFFFF" /></View>}
      </TouchableOpacity>

      {/* 中间歌曲信息 */}
      <TouchableOpacity style={styles.center} onPress={handleOpenPlayDetail} activeOpacity={0.7}>
        <Text style={styles.songName} numberOfLines={1}>{hasTrack ? musicInfo.name : '暂无播放歌曲'}</Text>
        <Text style={styles.singer} numberOfLines={1}>{hasTrack ? (musicInfo.singer || '未知歌手') : '点击选择歌曲播放'}</Text>
      </TouchableOpacity>

      {/* 右侧控制区：QQ 音乐级精致三圆钮协调体系（32x32，严格对称、水平居中） */}
      <View style={styles.right}>
        {/* 1. 播放/暂停键（绿色主胶囊） */}
        <ScaleBtn onPress={handleTogglePlay} testID="tabbar-toggle">
          <View style={[styles.toggleBtn, !hasTrack && styles.toggleBtnDisabled]}>
            <Icon name={isPlay ? 'pause' : 'play'} color="#FFFFFF" size={15} />
          </View>
        </ScaleBtn>

        {/* 2. 喜欢键（32x32 精致圆形容器，红心高亮/淡红微光） */}
        <ScaleBtn onPress={handleToggleLove} testID="tabbar-love">
          <View style={[styles.actionBtn, isLove && styles.actionBtnLoved]}>
            <Icon name="love" color={isLove ? '#EF4444' : '#5A616B'} size={17} />
          </View>
        </ScaleBtn>

        {/* 3. 播放队列键（32x32 精致圆形容器，带稍后播状态微标） */}
        <ScaleBtn onPress={onOpenList} testID="tabbar-list">
          <View style={styles.actionBtn}>
            <Icon name="list-order" color="#5A616B" size={17} />
            {hasTempTrack && <View style={styles.queueDot} />}
          </View>
        </ScaleBtn>
      </View>
    </View>
  )
}

/**
 * 底部导航栏：播放胶囊与 Tab 融为一体（QQ 音乐式）
 * - 顶部「现在播放」行：封面 + 歌曲信息 + 播放/暂停 / 喜欢 / 列表
 * - 底部 Tab 行：发现 / 歌单 / 排行榜 / 我的 / 设置
 */
const TabBar = () => {
  const activeId = useNavActiveId()
  const navigationBarHeight = useNavigationBarHeight()
  const queueRef = useRef<PlayQueueDrawerType>(null)

  return (
    <View style={[styles.container, { height: PLAY_ROW_HEIGHT + TAB_ROW_HEIGHT + navigationBarHeight, paddingBottom: navigationBarHeight }]}>
      <NowPlayingRow onOpenList={() => queueRef.current?.show()} />

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
                <Icon name={icon} size={20} color={active ? '#31C27C' : '#8A919E'} />
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECEEF1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  // ===== 现在播放行 =====
  playRow: {
    height: PLAY_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    position: 'relative',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(49, 196, 125, 0.12)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#31C27C',
  },
  coverWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    marginRight: 10,
    backgroundColor: '#1A1C20',
  },
  cover: {
    width: 42,
    height: 42,
  },
  coverFallback: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  songName: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 13,
  },
  singer: {
    color: colors.inkTertiary,
    fontWeight: '500',
    fontSize: 11,
    marginTop: 2,
  },
  right: {
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
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#31C27C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#31C27C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleBtnDisabled: {
    backgroundColor: '#C8CDD4',
    shadowOpacity: 0,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  actionBtnLoved: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  queueDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#31C27C',
  },
  // ===== Tab 行 =====
  tabRow: {
    height: TAB_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
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
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#31C27C',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#8A919E',
    fontWeight: '500',
  },
})
