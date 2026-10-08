import { memo, forwardRef, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import { type BoardItem } from '@/store/leaderboard/state'
import { colors, radius } from '@/theme/tokens'
import { getListDetail } from '@/core/leaderboard'

export interface BoardGalleryProps {
  list: BoardItem[]
  activeId: string
  loading: boolean
  error: boolean
  onRetry: () => void
  onSelectBoard: (board: BoardItem) => void
  onPlayBoard: (board: BoardItem) => void
}

export interface BoardGalleryType {}

// 官方巅峰主榜优先顺序（命中关键词者排前作为大卡展示）
const FEATURED_KEYS = ['飙升', '热歌', '新歌', '原创', '流行', '抖音', 'TOP500', '畅销']
const MAX_FEATURED_COUNT = 5

const splitBoards = (list: BoardItem[]) => {
  if (list.length <= MAX_FEATURED_COUNT) {
    return { featured: list, others: [] }
  }
  const featured: BoardItem[] = []
  for (const key of FEATURED_KEYS) {
    const hit = list.find(b => b.name.includes(key) && !featured.includes(b))
    if (hit) featured.push(hit)
    if (featured.length >= MAX_FEATURED_COUNT) break
  }
  for (const b of list) {
    if (featured.length >= MAX_FEATURED_COUNT) break
    if (!featured.includes(b)) featured.push(b)
  }
  const others = list.filter(b => !featured.includes(b))
  return { featured, others }
}

interface SongPreview {
  title: string
  singer: string
  pic?: string | null
}
type Top3State = Record<string, SongPreview[] | 'error'>

// ── 骨架屏 ──────────────────────────────
const Skeleton = () => {
  const op = useRef(new Animated.Value(0.45)).current
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.45, duration: 700, easing: Easing.linear, useNativeDriver: true }),
    ]))
    loop.start()
    return () => loop.stop()
  }, [op])
  return (
    <View style={s.skeletonWrap}>
      {[0, 1, 2].map(i => <Animated.View key={i} style={[s.chartSkeleton, { opacity: op }]} />)}
      <View style={s.skeletonGrid}>
        {[0, 1, 2, 3].map(i => <Animated.View key={i} style={[s.gridSkeleton, { opacity: op }]} />)}
      </View>
    </View>
  )
}

// ── 失败态 ──────────────────────────────
const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <View style={s.errorWrap}>
    <View style={s.errorIconBox}>
      <Text style={s.errorIconText}>!</Text>
    </View>
    <Text style={s.errorTitle}>排行榜加载失败</Text>
    <Text style={s.errorDesc}>网络连接不太顺畅，请检查网络后重试</Text>
    <TouchableOpacity style={s.retryBtn} activeOpacity={0.8} onPress={onRetry}>
      <Icon name="list-loop" size={14} color="#FFFFFF" />
      <Text style={s.retryText}>重新加载</Text>
    </TouchableOpacity>
  </View>
)

// ── 权威主榜大卡（带真数据 TOP3 预览 + 封面 + 播放全部）─────────
const ChartCard = memo(({ board, index, active, previews, onSelect, onPlay }: {
  board: BoardItem
  index: number
  active: boolean
  previews: SongPreview[] | 'error' | undefined
  onSelect: (b: BoardItem) => void
  onPlay: (b: BoardItem) => void
}) => {
  const top1 = previews && previews !== 'error' ? previews[0] : undefined
  return (
    <TouchableOpacity
      style={[s.chartCard, active && s.chartCardActive]}
      activeOpacity={0.85}
      onPress={() => onSelect(board)}
    >
      {/* 卡片头：榜单名 + 播放全部 */}
      <View style={s.chartHeader}>
        <View style={s.chartHeaderLeft}>
          {index === 0 ? <View style={s.chartPulseDot} /> : <Icon name="leaderboard" size={14} color={colors.brand} />}
          <Text style={s.chartName} numberOfLines={1}>{board.name}</Text>
        </View>
        <TouchableOpacity style={s.chartPlayAll} activeOpacity={0.7} onPress={() => onPlay(board)}>
          <Text style={s.chartPlayAllText}>播放全部</Text>
          <View style={s.chartPlayAllIcon}>
            <Icon name="play" size={9} color={colors.brand} />
          </View>
        </TouchableOpacity>
      </View>

      {/* 卡片体：TOP1 封面 + TOP3 歌曲列表 */}
      <View style={s.chartBody}>
        <View style={s.chartCoverBox}>
          {top1?.pic
            ? <Image url={top1.pic} style={s.chartCover} resizeMode="cover" />
            : <View style={[s.chartCover, { backgroundColor: colors.muted }]} />}
          <View style={s.chartRankBadge}>
            <Text style={s.chartRankBadgeText}>1</Text>
          </View>
        </View>

        <View style={s.chartSongs}>
          {previews === 'error' ? (
            <Text style={s.chartSongsError}>内容加载失败</Text>
          ) : !previews ? (
            [0, 1, 2].map(i => (
              <View key={i} style={s.chartSongRow}>
                <View style={[s.chartSongSkeleton, { width: 96 - i * 14 }]} />
              </View>
            ))
          ) : previews.length === 0 ? (
            <Text style={s.chartSongsError}>暂无数据</Text>
          ) : previews.slice(0, 3).map((song, i) => (
            <View key={i} style={s.chartSongRow}>
              <Text style={[s.chartSongIdx, i === 0 && s.chartSongIdxTop]}>{i + 1}</Text>
              <Text style={s.chartSongTitle} numberOfLines={1}>{song.title}</Text>
              {song.singer ? <Text style={s.chartSongSinger} numberOfLines={1}>- {song.singer}</Text> : null}
            </View>
          ))}
          <View style={s.chartMore}>
            <Text style={s.chartMoreText}>查看完整榜单</Text>
            <Icon name="chevron-right" size={11} color={colors.inkTertiary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
})

// ── 更多特色榜单小卡（双列网格，紧凑精致）────────────────
const SubBoardCard = memo(({ board, index, active, onSelect, onPlay }: {
  board: BoardItem
  index: number
  active: boolean
  onSelect: (b: BoardItem) => void
  onPlay: (b: BoardItem) => void
}) => {
  return (
    <TouchableOpacity
      style={[s.subCard, active && s.subCardActive]}
      activeOpacity={0.8}
      onPress={() => onSelect(board)}
    >
      <View style={s.subCardLeft}>
        <View style={s.subCardBadge}>
          <Text style={s.subCardBadgeText}>{index + 1}</Text>
        </View>
        <Text style={s.subCardTitle} numberOfLines={1}>{board.name}</Text>
      </View>
      <TouchableOpacity
        style={s.subCardPlayBtn}
        activeOpacity={0.7}
        onPress={(e) => {
          e.stopPropagation?.()
          onPlay(board)
        }}
      >
        <Icon name="play" size={10} color={colors.brand} />
      </TouchableOpacity>
    </TouchableOpacity>
  )
})

/**
 * 排行榜主画廊：
 * - 纯粹权威排行榜展示，彻底移除无关假分类与假新碟
 * - 核心主榜（TOP 5 大卡）：实时 TOP3 预览 + 封面 + 播放全部
 * - 特色精选榜单（双列网格）：展示平台全量真实榜单，点击秒进详情
 */
const BoardGallery = memo(forwardRef<BoardGalleryType, BoardGalleryProps>(({
  list,
  activeId,
  loading,
  error,
  onRetry,
  onSelectBoard,
  onPlayBoard,
}, ref) => {
  const { featured, others } = splitBoards(loading || error ? [] : list)
  const [top3, setTop3] = useState<Top3State>({})

  // 拉取核心主榜真实 TOP3 预览歌曲
  useEffect(() => {
    if (!featured.length) return
    let disposed = false
    for (const board of featured) {
      void getListDetail(board.id, 1).then(detail => {
        if (disposed) return
        const previews: SongPreview[] = detail.list.slice(0, 3).map(m => ({
          title: m.name ?? '',
          singer: m.singer ?? '',
          pic: (m.meta as any)?.picUrl ?? null,
        }))
        setTop3(prev => ({ ...prev, [board.id]: previews }))
      }).catch(() => {
        if (disposed) return
        setTop3(prev => ({ ...prev, [board.id]: 'error' }))
      })
    }
    return () => { disposed = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featured.map(b => b.id).join(',')])

  if (loading) return <Skeleton />
  if (error || !list.length) return <ErrorState onRetry={onRetry} />

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. 官方巅峰主榜 ── */}
      <View style={s.sectionHeader}>
        <View style={s.sectionTitleRow}>
          <Icon name="leaderboard" size={16} color={colors.brand} />
          <Text style={s.sectionTitle}>官方巅峰榜</Text>
          <View style={s.sectionTag}>
            <Text style={s.sectionTagText}>权威精选</Text>
          </View>
        </View>
        <Text style={s.sectionSub}>实时刷新</Text>
      </View>
      <View style={s.chartList}>
        {featured.map((board, i) => (
          <ChartCard
            key={board.id}
            board={board}
            index={i}
            active={activeId === board.id}
            previews={top3[board.id]}
            onSelect={onSelectBoard}
            onPlay={onPlayBoard}
          />
        ))}
      </View>

      {/* ── 2. 更多官方特色榜单 ── */}
      {others.length > 0 && (
        <View style={s.subSection}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <Icon name="album" size={15} color={colors.brand} />
              <Text style={s.sectionTitle}>更多特色榜单</Text>
              <View style={s.sectionTag}>
                <Text style={s.sectionTagText}>{others.length}个精选</Text>
              </View>
            </View>
            <Text style={s.sectionSub}>点击直达</Text>
          </View>
          <View style={s.subGrid}>
            {others.map((board, i) => (
              <SubBoardCard
                key={board.id}
                board={board}
                index={i + featured.length}
                active={activeId === board.id}
                onSelect={onSelectBoard}
                onPlay={onPlayBoard}
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  )
}))

BoardGallery.displayName = 'BoardGallery'

// ── 样式 ────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.2,
  },
  sectionTag: {
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sectionTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brand,
  },
  sectionSub: {
    fontSize: 11,
    color: colors.inkTertiary,
  },

  chartList: {
    gap: 12,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartCardActive: {
    borderColor: colors.brand,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    minWidth: 0,
  },
  chartPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.brand,
  },
  chartName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  chartPlayAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.muted,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chartPlayAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brand,
  },
  chartPlayAllIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartBody: {
    flexDirection: 'row',
    gap: 12,
  },
  chartCoverBox: {
    width: 86,
    height: 86,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    position: 'relative',
    backgroundColor: colors.muted,
  },
  chartCover: {
    width: '100%',
    height: '100%',
  },
  chartRankBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartRankBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chartSongs: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-around',
  },
  chartSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartSongIdx: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkTertiary,
    width: 12,
  },
  chartSongIdxTop: {
    color: colors.brand,
  },
  chartSongTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.ink,
    flexShrink: 1,
  },
  chartSongSinger: {
    fontSize: 11,
    color: colors.inkTertiary,
    flexShrink: 1,
  },
  chartSongSkeleton: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  chartSongsError: {
    fontSize: 12,
    color: colors.inkTertiary,
  },
  chartMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  chartMoreText: {
    fontSize: 10.5,
    color: colors.inkTertiary,
  },

  // 更多特色榜单双列网格
  subSection: {
    marginTop: 20,
  },
  subGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subCard: {
    width: '48.5%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  subCardActive: {
    borderColor: colors.brand,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  subCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  subCardBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand,
  },
  subCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    flex: 1,
  },
  subCardPlayBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 骨架屏与错误态
  skeletonWrap: { padding: 20, gap: 14 },
  chartSkeleton: { height: 130, borderRadius: radius.lg, backgroundColor: '#E2E8F0' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  gridSkeleton: { width: '48.5%', height: 50, borderRadius: radius.md, backgroundColor: '#E2E8F0' },

  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorIconText: { fontSize: 24, fontWeight: '800', color: colors.brand },
  errorTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  errorDesc: { fontSize: 12, color: colors.inkSecondary, marginBottom: 16, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
})

export default BoardGallery
