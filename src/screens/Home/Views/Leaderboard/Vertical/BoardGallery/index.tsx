import { memo, forwardRef, useImperativeHandle, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import { type BoardItem } from '@/store/leaderboard/state'
import { colors, radius } from '@/theme/tokens'
import { getListDetail } from '@/core/leaderboard'
import { setNavActiveId } from '@/core/common'
import { openSearchOverlay } from '@/core/searchOverlay'

export interface BoardGalleryProps {
  list: BoardItem[]
  activeId: string
  loading: boolean
  error: boolean
  onRetry: () => void
  onSelectBoard: (board: BoardItem) => void
  onPlayBoard: (board: BoardItem) => void
}

export interface BoardGalleryType {
  scrollToSection: (key: 'charts' | 'genre' | 'newRelease') => void
}

// 官方榜优先顺序（命中关键词者排前）
const FEATURED_KEYS = ['飙升', '热歌', '新歌', '原创', '流行', '抖音']
const pickFeatured = (list: BoardItem[]): BoardItem[] => {
  if (list.length <= 4) return list
  const picked: BoardItem[] = []
  for (const key of FEATURED_KEYS) {
    const hit = list.find(b => b.name.includes(key) && !picked.includes(b))
    if (hit) picked.push(hit)
    if (picked.length >= 4) break
  }
  for (const b of list) {
    if (picked.length >= 4) break
    if (!picked.includes(b)) picked.push(b)
  }
  return picked
}

interface SongPreview {
  title: string
  singer: string
  pic?: string | null
}
type Top3State = Record<string, SongPreview[] | 'error'>

// 流派分类（图标 → 音源曲风关键词搜索）
const GENRES = [
  { key: 'cyber', name: '赛博电音', sub: 'EDM / Bass', icon: 'list-random', keyword: '电音' },
  { key: 'pop', name: '流行经典', sub: 'Pop / Vocal', icon: 'single', keyword: '流行' },
  { key: 'rock', name: '摇滚现场', sub: 'Rock / Indie', icon: 'logo', keyword: '摇滚' },
  { key: 'oriental', name: '国风雅韵', sub: 'Oriental', icon: 'love', keyword: '国风' },
] as const

// 新碟上架（高质量音质标签 + 精选封面）
const NEW_RELEASES = [
  {
    key: 'nr_1',
    title: 'Future Bass Horizon',
    sub: 'PulseLab · 概念专辑',
    badge: '24bit/96kHz',
    bg: '#0F766E',
    img: 'https://p2.music.126.net/v7_32p-4H_9fW71nJ3uB9A==/109951168536340245.jpg?param=300y300',
    keyword: 'Future Bass',
  },
  {
    key: 'nr_2',
    title: '清晨与未完诗篇',
    sub: 'Acoustic Session · 现场',
    badge: '杜比全景声',
    bg: '#6D28D9',
    img: 'https://p1.music.126.net/79VqK3c8uV2UvQ6P244E3g==/109951165434199923.jpg?param=300y300',
    keyword: '民谣',
  },
] as const

/** 跨页快捷搜索：直接打开独立搜索页并自动搜索该关键词（不再切换发现页） */
const goQuickSearch = (keyword: string) => {
  openSearchOverlay(undefined, keyword)
}

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
      {[0, 1].map(i => <Animated.View key={i} style={[s.chartSkeleton, { opacity: op }]} />)}
      <View style={s.skeletonRow}>
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
    <Text style={s.errorTitle}>榜单加载失败</Text>
    <Text style={s.errorDesc}>网络似乎不太顺畅，请检查网络后重试</Text>
    <TouchableOpacity style={s.retryBtn} activeOpacity={0.8} onPress={onRetry}>
      <Icon name="list-loop" size={14} color="#FFFFFF" />
      <Text style={s.retryText}>重新加载</Text>
    </TouchableOpacity>
  </View>
)

// ── 权威排行榜大卡（真数据 TOP3，设计稿样式）─────────
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

/**
 * 音乐馆内容流（2026-09-29 设计稿）：
 * - 权威排行榜：纵向堆叠大卡，真数据 TOP3 预览 + 一键播放
 * - 流派分类：四列圆标网格，点击跳转发现页搜索
 * - 新碟上架：两列高质量新碟卡
 * - 加载骨架屏 / 失败重试态
 */
const BoardGallery = memo(forwardRef<BoardGalleryType, BoardGalleryProps>(({ list, activeId, loading, error, onRetry, onSelectBoard, onPlayBoard }, ref) => {
  const scrollRef = useRef<ScrollView>(null)
  const sectionOffsets = useRef<{ genre?: number, newRelease?: number }>({})
  const featured = loading || error ? [] : pickFeatured(list)
  const [top3, setTop3] = useState<Top3State>({})

  // 拉官方榜真实 TOP3（getListDetail 自带分页缓存，进详情不重复请求）
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

  // 供页头子 Tab 调用的分区滚动
  useImperativeHandle(ref, () => ({
    scrollToSection(key: 'charts' | 'genre' | 'newRelease') {
      if (key === 'charts') {
        scrollRef.current?.scrollTo({ y: 0, animated: true })
        return
      }
      const y = sectionOffsets.current[key]
      if (y != null) scrollRef.current?.scrollTo({ y, animated: true })
    },
  }), [])

  if (loading) return <Skeleton />
  if (error || !list.length) return <ErrorState onRetry={onRetry} />

  return (
    <ScrollView
      ref={scrollRef}
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 权威排行榜 ── */}
      <View style={s.sectionHeader}>
        <View style={s.sectionTitleRow}>
          <Text style={s.sectionTitle}>权威排行榜</Text>
          <View style={s.sectionTag}>
            <Text style={s.sectionTagText}>实时更新</Text>
          </View>
        </View>
        <Text style={s.sectionSub}>每整点刷新</Text>
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

      {/* ── 流派分类 ── */}
      <View
        style={s.sectionHeader}
        onLayout={e => { sectionOffsets.current.genre = e.nativeEvent.layout.y - 56 }}
      >
        <View style={s.sectionTitleRow}>
          <Text style={s.sectionTitle}>流派分类</Text>
        </View>
        <TouchableOpacity style={s.moreLink} activeOpacity={0.6} onPress={() => { goQuickSearch('歌单') }}>
          <Text style={s.moreLinkText}>全部流派</Text>
          <Icon name="chevron-right" size={12} color={colors.inkTertiary} />
        </TouchableOpacity>
      </View>
      <View style={s.genreGrid}>
        {GENRES.map(g => (
          <TouchableOpacity
            key={g.key}
            style={s.genreCard}
            activeOpacity={0.75}
            onPress={() => { goQuickSearch(g.keyword) }}
          >
            <View style={s.genreIconWrap}>
              <Icon name={g.icon} size={16} color={colors.brand} />
            </View>
            <Text style={s.genreName} numberOfLines={1}>{g.name}</Text>
            <Text style={s.genreSub} numberOfLines={1}>{g.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── 新碟上架 ── */}
      <View
        style={s.sectionHeader}
        onLayout={e => { sectionOffsets.current.newRelease = e.nativeEvent.layout.y - 56 }}
      >
        <View style={s.sectionTitleRow}>
          <Text style={s.sectionTitle}>新碟上架 · 母带首发</Text>
        </View>
        <Text style={s.sectionSub}>无损空间音频</Text>
      </View>
      <View style={s.newReleaseGrid}>
        {NEW_RELEASES.map(nr => (
          <TouchableOpacity
            key={nr.key}
            style={s.newReleaseCard}
            activeOpacity={0.8}
            onPress={() => { goQuickSearch(nr.keyword) }}
          >
            <View style={[s.newReleaseCoverBox, { backgroundColor: nr.bg }]}>
              <Image url={nr.img} style={s.newReleaseCover} resizeMode="cover" />
              <View style={s.newReleaseBadge}>
                <Text style={s.newReleaseBadgeText}>{nr.badge}</Text>
              </View>
            </View>
            <Text style={s.newReleaseTitle} numberOfLines={1}>{nr.title}</Text>
            <Text style={s.newReleaseSub} numberOfLines={1}>{nr.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}))

BoardGallery.displayName = 'BoardGallery'

// ── 样式 ────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  sectionTitle: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  sectionTag: {
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sectionTagText: { fontSize: 10, fontWeight: '600', color: colors.brand },
  sectionSub: { fontSize: 11, color: colors.inkTertiary },
  moreLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  moreLinkText: { fontSize: 12, color: colors.inkTertiary },

  // ── 权威排行榜大卡 ──────────────────────
  chartList: { gap: 12 },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  chartCardActive: { borderColor: 'rgba(16, 185, 129, 0.5)' },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  chartHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 },
  chartPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
  chartName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  chartPlayAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chartPlayAllText: { fontSize: 11.5, fontWeight: '500', color: colors.brand },
  chartPlayAllIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartBody: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  chartCoverBox: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    position: 'relative',
  },
  chartCover: { width: '100%', height: '100%' },
  chartRankBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    minWidth: 16,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.brand,
    alignItems: 'center',
  },
  chartRankBadgeText: { fontSize: 9.5, fontWeight: '800', color: '#FFFFFF' },
  chartSongs: { flex: 1, minWidth: 0, gap: 7 },
  chartSongRow: { flexDirection: 'row', alignItems: 'center' },
  chartSongIdx: { fontSize: 12, fontWeight: '700', width: 16, color: colors.inkTertiary },
  chartSongIdxTop: { color: colors.brand },
  chartSongTitle: { fontSize: 12.5, fontWeight: '600', color: colors.ink, maxWidth: '58%', flexShrink: 1 },
  chartSongSinger: { fontSize: 11, color: colors.inkTertiary, flexShrink: 1, marginLeft: 4 },
  chartMore: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  chartMoreText: { fontSize: 10.5, color: colors.inkTertiary },
  chartSongsError: { fontSize: 12, color: colors.inkTertiary, textAlign: 'center', paddingVertical: 10 },
  chartSongSkeleton: { height: 11, borderRadius: 5, backgroundColor: '#E9EBF0' },

  // ── 流派分类 ────────────────────────────
  genreGrid: { flexDirection: 'row', gap: 10 },
  genreCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  genreIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  genreName: { fontSize: 12, fontWeight: '600', color: colors.ink },
  genreSub: { fontSize: 9.5, color: colors.inkTertiary, marginTop: 2 },

  // ── 新碟上架 ────────────────────────────
  newReleaseGrid: { flexDirection: 'row', gap: 12 },
  newReleaseCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 10,
    gap: 6,
  },
  newReleaseCoverBox: {
    aspectRatio: 1.45,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    position: 'relative',
  },
  newReleaseCover: { width: '100%', height: '100%' },
  newReleaseBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  newReleaseBadgeText: { fontSize: 9, fontWeight: '700', color: colors.brand },
  newReleaseTitle: { fontSize: 12, fontWeight: '700', color: colors.ink },
  newReleaseSub: { fontSize: 10.5, color: colors.inkTertiary, marginTop: -2 },

  // ── 骨架屏 ──────────────────────────────
  skeletonWrap: { paddingHorizontal: 20, paddingTop: 12 },
  chartSkeleton: { height: 148, borderRadius: radius.lg, backgroundColor: '#E9EBF0', marginBottom: 12 },
  skeletonRow: { flexDirection: 'row', gap: 10 },
  gridSkeleton: { flex: 1, height: 88, borderRadius: radius.lg, backgroundColor: '#E9EBF0' },

  // ── 失败态 ──────────────────────────────
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas, padding: 30 },
  errorIconBox: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  errorIconText: { fontSize: 28, fontWeight: '800', color: '#F59E0B' },
  errorTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 5 },
  errorDesc: { fontSize: 12.5, color: colors.inkTertiary, textAlign: 'center', marginBottom: 18 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.brand, borderRadius: 22, paddingVertical: 10, paddingHorizontal: 26,
    shadowColor: colors.brand, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  retryText: { fontSize: 13.5, fontWeight: '700', color: '#FFFFFF' },
})

export default BoardGallery
