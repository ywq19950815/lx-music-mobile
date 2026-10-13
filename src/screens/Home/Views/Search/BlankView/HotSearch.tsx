import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native'
import { type Source, type InitState } from '@/store/hotSearch/state'
import { getList } from '@/core/hotSearch'
import Text from '@/components/common/Text'
import PressableScale from '@/components/common/PressableScale'
import { useI18n } from '@/lang'
import { Icon } from '@/components/common/Icon'
import { colors, radius } from '@/theme/tokens'

interface ListProps {
  onSearch: (keyword: string) => void
}
export interface HotSearchType {
  show: (source: Source) => void
}

export type List = NonNullable<InitState['sourceList'][keyof InitState['sourceList']]>

// 真实高频热门词兜底（避免弱网或首次加载时界面空白）
const DEFAULT_HOT_SEARCHES = [
  '周杰伦', '陈奕迅', '林俊杰', '薛之谦', '邓紫棋', '陶喆',
  '晴天', '起风了', '海阔天空', '告白气球', '七里香', '孤勇者',
  '爱如火', '水星记', '晚风心里吹', '凄美地', '乌梅子酱', '花海',
]

/** 骨架屏脉冲动画（与排行榜画廊同语言） */
const useSkeletonPulse = (active: boolean) => {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (!active) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [active, anim])
  return anim
}

const SkeletonPill = ({ width }: { width: number }) => {
  const pulse = useSkeletonPulse(true)
  return <Animated.View style={[styles.skeletonPill, { width, opacity: pulse }]} />
}

const ListItem = ({ keyword, index, onSearch }: {
  keyword: string
  index: number
  onSearch: (keyword: string) => void
}) => {
  const isTop3 = index < 3

  return (
    <PressableScale
      style={[
        styles.tagPill,
        isTop3 ? styles.tagPillTop : styles.tagPillNormal,
      ]}
      scaleTo={0.94}
      onPress={() => { onSearch(keyword) }}
    >
      {isTop3 && (
        <View style={[styles.topBadge, index === 0 && styles.topBadgeFirst]}>
          <Text size={9.5} color="#FFFFFF" style={styles.topBadgeText}>
            {index + 1}
          </Text>
        </View>
      )}
      <Text
        style={[styles.tagText, isTop3 && styles.tagTextTop]}
        size={12.5}
        color={isTop3 ? '#1B8A57' : colors.ink}
        numberOfLines={1}
      >
        {keyword}
      </Text>
    </PressableScale>
  )
}

export default forwardRef<HotSearchType, ListProps>((props, ref) => {
  const [list, setList] = useState<List>(DEFAULT_HOT_SEARCHES)
  const [sourceName, setSourceName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const currentSourceRef = useRef<Source>('all')
  const t = useI18n()

  const isUnmountedRef = useRef(false)
  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  const loadHotSearch = (source: Source) => {
    setLoading(true)
    void getList(source).then((fetchedList) => {
      if (isUnmountedRef.current) return
      setLoading(false)
      if (fetchedList && fetchedList.length > 0) {
        setList(fetchedList)
        setLoadError(false)
      } else {
        setLoadError(true)
      }
    }).catch(() => {
      if (isUnmountedRef.current) return
      setLoading(false)
      setLoadError(true)
    })
  }

  useImperativeHandle(ref, () => ({
    show(source) {
      currentSourceRef.current = source
      if (source && source !== 'all') {
        const sourceMap: Record<string, string> = {
          kw: '酷我',
          kg: '酷狗',
          tx: 'QQ音乐',
          wy: '网易云',
          mg: '咪咕',
        }
        setSourceName(sourceMap[source] || source.toUpperCase())
      } else {
        setSourceName('')
      }
      loadHotSearch(source)
    },
  }), [])

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.accentBar} />
            <Text style={styles.title} size={15} color={colors.ink}>
              {t('search_hot_search')}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>大家都在搜</Text>
            </View>
          </View>
          {sourceName ? (
            <View style={styles.sourceTag}>
              <Icon name="leaderboard" size={11} color={colors.brand} />
              <Text style={styles.sourceTagText}>{sourceName}热度榜</Text>
            </View>
          ) : null}
        </View>

        {loading ? (
          /* 骨架屏：加载中不空白 */
          <View style={styles.list}>
            {[64, 88, 56, 96, 72, 80, 60, 84].map((w, i) => (
              <View key={i} style={styles.skeletonSlot}>
                <SkeletonPill width={w} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {list.map((keyword, idx) => (
              <ListItem
                keyword={keyword}
                index={idx}
                key={`${keyword}_${idx}`}
                onSearch={props.onSearch}
              />
            ))}
          </View>
        )}

        {/* 弱网提示：保留兜底热词的同时给出重试入口 */}
        {loadError && !loading ? (
          <TouchableOpacity
            style={styles.retryHint}
            activeOpacity={0.7}
            onPress={() => loadHotSearch(currentSourceRef.current)}
          >
            <Icon name="available_updates" size={11} color={colors.inkTertiary} />
            <Text style={styles.retryHintText}>网络不稳定，显示常用热词，点击重试</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: colors.muted,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentBar: {
    width: 3.5,
    height: 14,
    backgroundColor: colors.brand,
    borderRadius: 2,
    marginRight: 8,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  badge: {
    backgroundColor: colors.muted,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10.5,
    color: colors.inkSecondary,
    fontWeight: '600',
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(49, 194, 124, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  sourceTagText: {
    fontSize: 10.5,
    color: colors.brandDeep,
    fontWeight: '700',
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 6.5,
    borderRadius: radius.pill,
    marginRight: 9,
    marginBottom: 10,
  },
  tagPillTop: {
    backgroundColor: 'rgba(49, 194, 124, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(49, 194, 124, 0.25)',
  },
  tagPillNormal: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  topBadge: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  topBadgeFirst: {
    backgroundColor: colors.brandDeep,
  },
  topBadgeText: {
    fontWeight: '900',
    lineHeight: 13,
  },
  tagText: {
    fontWeight: '500',
  },
  tagTextTop: {
    fontWeight: '700',
  },
  skeletonSlot: {
    marginRight: 9,
    marginBottom: 10,
  },
  skeletonPill: {
    height: 29,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
  },
  retryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 2,
  },
  retryHintText: {
    fontSize: 11,
    color: colors.inkTertiary,
  },
})
