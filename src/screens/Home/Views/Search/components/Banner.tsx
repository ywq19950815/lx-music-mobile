import { memo, useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Dimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import { colors, radius, softShadow } from '@/theme/tokens'

const { width: SCREEN_W } = Dimensions.get('window')
const SIDE = 16
const CARD_W = SCREEN_W - SIDE * 2
const CARD_H = 132

/** 本地静态推荐位（占位数据，后续可接「发现/推荐」接口）。 */
const BANNERS = [
  { id: 'fm', title: '私人 FM', subtitle: '为你精挑细选每一首', bg: colors.brand, glow: colors.brandLight },
  { id: 'daily', title: '每日推荐', subtitle: '30 首新鲜好歌 · 每日更新', bg: '#3FD08A', glow: colors.brand },
  { id: 'top', title: '实时排行榜', subtitle: '热歌新歌 · 一网打尽', bg: colors.brandDeep, glow: colors.brand },
  { id: 'square', title: '歌单广场', subtitle: '万千精选合辑等你发现', bg: colors.brand, glow: colors.brandLight },
]

const BannerItem = ({ item }: { item: typeof BANNERS[number] }) => (
  <TouchableOpacity
    activeOpacity={0.92}
    onPress={() => toast(`「${item.title}」敬请期待`)}
    style={[styles.itemWrap, { width: CARD_W }]}
  >
    <View style={[styles.card, { backgroundColor: item.bg }]}>
      {/* 斜向光斑，营造质感层次（无需原生渐变库） */}
      <View style={[styles.glow, { backgroundColor: item.glow }]} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>推荐</Text>
      </View>
    </View>
  </TouchableOpacity>
)

const Banner = memo(() => {
  const scrollRef = useRef<ScrollView>(null)
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  activeRef.current = active
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = (index: number) => {
    const next = (index + BANNERS.length) % BANNERS.length
    setActive(next)
    scrollRef.current?.scrollTo({ x: next * CARD_W, animated: true })
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      goTo(activeRef.current + 1)
    }, 3500)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_W)
    if (idx !== active) setActive(idx)
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.scroll}
      >
        {BANNERS.map(item => <BannerItem key={item.id} item={item} />)}
      </ScrollView>
      <View style={styles.dots}>
        {BANNERS.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => goTo(i)}
            style={[styles.dot, i === active && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  )
})

export default Banner

const styles = createStyle({
  container: {
    marginHorizontal: SIDE,
    marginTop: 12,
    marginBottom: 4,
  },
  scroll: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  itemWrap: {
    height: CARD_H,
    paddingRight: 0,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...softShadow('md'),
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.28,
    transform: [{ rotate: '30deg' }],
  },
  textWrap: {
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginHorizontal: 3,
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.brand,
  },
})
