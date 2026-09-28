import { memo, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { type BoardItem } from '@/store/leaderboard/state'
import { colors } from '@/theme/tokens'
import { getListDetail } from '@/core/leaderboard'
import { useWindowSize } from '@/utils/hooks'

export interface BoardGalleryProps {
  list: BoardItem[]
  activeId: string
  loading: boolean
  error: boolean
  onRetry: () => void
  onSelectBoard: (board: BoardItem) => void
}

// 榜单封面主题色（按名称关键词匹配，未命中走轮换色板）
const BOARD_COLORS: Array<[string, string, string]> = [
  ['热歌', '#FF5A2E', '#FF8A3D'],
  ['新歌', '#2E7BFF', '#5AA5FF'],
  ['飙升', '#E62021', '#FF6A4D'],
  ['原创', '#8E44EC', '#B67AF5'],
  ['流行', '#7C3AED', '#A78BFA'],
  ['抖音', '#1D1F24', '#4A4E58'],
  ['欧美', '#0D9488', '#2DD4BF'],
  ['韩国', '#DB2777', '#F472B6'],
  ['日本', '#D97706', '#FBBF24'],
  ['网络', '#0891B2', '#22D3EE'],
  ['电音', '#4F46E5', '#818CF8'],
  ['影视', '#B45309', '#F59E0B'],
]
const FALLBACK = [
  ['#31C27C', '#6EE7A8'],
  ['#2563EB', '#60A5FA'],
  ['#DC2626', '#F87171'],
  ['#7C3AED', '#A78BFA'],
  ['#0D9488', '#2DD4BF'],
  ['#D97706', '#FBBF24'],
]
const boardGradient = (name: string, index: number) => {
  for (const [key, c1, c2] of BOARD_COLORS) if (name.includes(key)) return [c1, c2]
  return FALLBACK[index % FALLBACK.length]
}

// 官方榜优先顺序（命中关键词者排前）
const FEATURED_KEYS = ['飙升', '新歌', '热歌', '原创', '流行', '抖音']
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
}
type Top3State = Record<string, SongPreview[] | 'error'>

// ── 骨架屏 ──────────────────────────────
const Skeleton = ({ cardW }: { cardW: number }) => {
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
      <View style={s.featRow}>
        {[0, 1, 2].map(i => (
          <Animated.View key={i} style={[s.featSkeleton, { width: cardW, opacity: op }]} />
        ))}
      </View>
      <View style={s.gridRow}>
        {[0, 1].map(i => <Animated.View key={i} style={[s.gridSkeleton, { opacity: op }]} />)}
      </View>
      <View style={s.gridRow}>
        {[0, 1].map(i => <Animated.View key={i} style={[s.gridSkeleton, { opacity: op }]} />)}
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

// ── 单张官方榜大卡（真数据 TOP3）──────────────
const FeaturedCard = memo(({ board, index, cardW, active, previews, onSelect }: {
  board: BoardItem
  index: number
  cardW: number
  active: boolean
  previews: SongPreview[] | 'error' | undefined
  onSelect: (b: BoardItem) => void
}) => {
  const [c1, c2] = boardGradient(board.name, index)
  return (
    <TouchableOpacity style={[s.featCard, { width: cardW }, active && s.featCardActive]} activeOpacity={0.85} onPress={() => onSelect(board)}>
      {/* 封面区 */}
      <View style={[s.featCover, { backgroundColor: c1 }]}>
        <View style={[s.featCoverGlow, { backgroundColor: c2 }]} />
        <Text style={s.featCoverName} numberOfLines={2}>{board.name}</Text>
        <View style={s.featCoverBadge}>
          <Text style={s.featCoverBadgeText}>TOP 100</Text>
        </View>
        <View style={s.featCoverPlay}>
          <Icon name="play" size={11} color={c1} />
        </View>
      </View>
      {/* TOP3 真数据 */}
      <View style={s.featSongs}>
        {previews === 'error' ? (
          <Text style={s.featSongsError}>内容加载失败</Text>
        ) : !previews ? (
          [0, 1, 2].map(i => (
            <View key={i} style={s.featSongRow}>
              <View style={[s.featIdxSkeleton, { width: 14 + i * 2 }]} />
              <View style={s.featLineSkeleton} />
            </View>
          ))
        ) : previews.length === 0 ? (
          <Text style={s.featSongsError}>暂无数据</Text>
        ) : previews.slice(0, 3).map((song, i) => (
          <View key={i} style={s.featSongRow}>
            <Text style={[s.featSongIdx, { color: i === 0 ? colors.brand : i === 1 ? '#94A3B8' : '#C8A254' }]}>{i + 1}</Text>
            <Text style={s.featSongTitle} numberOfLines={1}>{song.title}</Text>
            <Text style={s.featSongSinger} numberOfLines={1}>- {song.singer}</Text>
          </View>
        ))}
        <View style={s.featSongMore}>
          <Text style={s.featSongMoreText}>查看完整榜单</Text>
          <Icon name="chevron-right" size={11} color={colors.inkTertiary} />
        </View>
      </View>
    </TouchableOpacity>
  )
})

/**
 * QQ 音乐式榜单大盘：
 * - 官方榜：横向滑动大卡，展示真实 TOP3 歌曲
 * - 全部榜单：两列渐变封面网格
 * - 加载骨架屏 / 失败重试态
 */
export default memo(({ list, activeId, loading, error, onRetry, onSelectBoard }: BoardGalleryProps) => {
  const { width: winW } = useWindowSize()
  const cardW = Math.min(winW * 0.74, 296)
  const featured = loading || error ? [] : pickFeatured(list)
  const rest = loading || error ? [] : list.filter(b => !featured.includes(b))
  const [top3, setTop3] = useState<Top3State>({})

  // 拉官方榜真实 TOP3（getListDetail 自带分页缓存，进详情不重复请求）
  useEffect(() => {
    if (!featured.length) return
    let disposed = false
    for (const board of featured) {
      void getListDetail(board.id, 1).then(detail => {
        if (disposed) return
        const previews: SongPreview[] = detail.list.slice(0, 3).map(m => ({
          title: m.meta.songName ?? m.name ?? '',
          singer: m.meta.singer ?? '',
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

  if (loading) return <Skeleton cardW={cardW} />
  if (error || !list.length) return <ErrorState onRetry={onRetry} />

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* ── 官方榜：横向滑动大卡 ── */}
      <View style={s.sectionRow}>
        <View style={s.sectionBar} />
        <Text style={s.sectionTitle}>官方榜</Text>
        <Text style={s.sectionSub}>每日实时更新</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardW + 12}
        decelerationRate="fast"
        contentContainerStyle={s.featScroll}
      >
        {featured.map((board, i) => (
          <FeaturedCard
            key={board.id}
            board={board}
            index={i}
            cardW={cardW}
            active={activeId === board.id}
            previews={top3[board.id]}
            onSelect={onSelectBoard}
          />
        ))}
      </ScrollView>

      {/* ── 全部榜单：两列网格 ── */}
      {rest.length > 0 && (
        <>
          <View style={s.sectionRow}>
            <View style={s.sectionBar} />
            <Text style={s.sectionTitle}>全部榜单</Text>
            <Text style={s.sectionSub}>{rest.length} 个</Text>
          </View>
          <View style={s.grid}>
            {rest.map((board, i) => {
              const [c1, c2] = boardGradient(board.name, i)
              const active = activeId === board.id
              return (
                <TouchableOpacity
                  key={board.id}
                  style={[s.gridCard, active && s.gridCardActive]}
                  activeOpacity={0.85}
                  onPress={() => onSelectBoard(board)}
                >
                  <View style={[s.gridCover, { backgroundColor: c1 }]}>
                    <View style={[s.gridCoverGlow, { backgroundColor: c2 }]} />
                    <Text style={s.gridCoverName} numberOfLines={2}>{board.name}</Text>
                    <View style={s.gridCoverPlay}>
                      <Icon name="play" size={9} color={c1} />
                    </View>
                  </View>
                  <Text style={s.gridCardName} numberOfLines={1}>{board.name}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </>
      )}
    </ScrollView>
  )
})

// ── 样式 ────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionBar: { width: 4, height: 15, borderRadius: 2, backgroundColor: colors.brand, marginRight: 8 },
  sectionTitle: { fontSize: 16.5, fontWeight: '800', color: colors.ink },
  sectionSub: { fontSize: 11.5, color: colors.inkTertiary, marginLeft: 8, flex: 1 },

  // 官方榜大卡
  featScroll: { gap: 12, paddingRight: 16 },
  featCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    alignItems: 'stretch',
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  featCardActive: { borderColor: colors.brand },
  featCover: {
    width: 96,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  featCoverGlow: { position: 'absolute', top: -30, right: -30, width: 80, height: 80, borderRadius: 40, opacity: 0.35 },
  featCoverName: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', lineHeight: 20, zIndex: 1 },
  featCoverBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, zIndex: 1 },
  featCoverBadgeText: { fontSize: 8.5, fontWeight: '700', color: '#FFFFFF' },
  featCoverPlay: {
    position: 'absolute', bottom: 8, right: 8, width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  featSongs: { flex: 1, justifyContent: 'center', gap: 7 },
  featSongRow: { flexDirection: 'row', alignItems: 'center' },
  featSongIdx: { fontSize: 14, fontWeight: '800', width: 18 },
  featSongTitle: { fontSize: 13, fontWeight: '600', color: colors.ink, maxWidth: '52%' },
  featSongSinger: { fontSize: 12, color: colors.inkTertiary, flex: 1 },
  featSongMore: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  featSongMoreText: { fontSize: 11, color: colors.inkTertiary },
  featSongsError: { fontSize: 12, color: colors.inkTertiary, textAlign: 'center', paddingVertical: 10 },
  featIdxSkeleton: { height: 12, borderRadius: 6, backgroundColor: '#EDEFF3' },
  featLineSkeleton: { flex: 1, height: 12, borderRadius: 6, backgroundColor: '#EDEFF3', marginLeft: 8 },

  // 全部榜单网格
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: {
    width: '31.5%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 7,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  gridCardActive: { borderColor: colors.brand },
  gridCover: {
    aspectRatio: 1,
    borderRadius: 10,
    padding: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  gridCoverGlow: { position: 'absolute', top: -24, right: -24, width: 70, height: 70, borderRadius: 35, opacity: 0.4 },
  gridCoverName: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', lineHeight: 19, zIndex: 1 },
  gridCoverPlay: {
    position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  gridCardName: { fontSize: 11.5, color: colors.inkSecondary, fontWeight: '600', marginTop: 6, marginBottom: 2, marginLeft: 2 },

  // 骨架屏
  skeletonWrap: { paddingHorizontal: 16, paddingTop: 12 },
  featRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  featSkeleton: { height: 116, borderRadius: 16, backgroundColor: '#E9EBF0' },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  gridSkeleton: { flex: 1, aspectRatio: 1.1, borderRadius: 14, backgroundColor: '#E9EBF0' },

  // 失败态
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA', padding: 30 },
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
