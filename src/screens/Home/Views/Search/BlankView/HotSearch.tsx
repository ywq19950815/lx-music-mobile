import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { type Source, type InitState } from '@/store/hotSearch/state'
import { getList } from '@/core/hotSearch'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { Icon } from '@/components/common/Icon'

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

const ListItem = ({ keyword, index, onSearch }: {
  keyword: string
  index: number
  onSearch: (keyword: string) => void
}) => {
  const isTop3 = index < 3

  return (
    <TouchableOpacity
      style={[
        styles.tagPill,
        isTop3 ? styles.tagPillTop : styles.tagPillNormal,
      ]}
      activeOpacity={0.7}
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
        color={isTop3 ? '#047857' : '#334155'}
        numberOfLines={1}
      >
        {keyword}
      </Text>
    </TouchableOpacity>
  )
}

export default forwardRef<HotSearchType, ListProps>((props, ref) => {
  const [list, setList] = useState<List>(DEFAULT_HOT_SEARCHES)
  const [sourceName, setSourceName] = useState<string>('')
  const t = useI18n()

  const isUnmountedRef = useRef(false)
  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  useImperativeHandle(ref, () => ({
    show(source) {
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
      void getList(source).then((fetchedList) => {
        if (isUnmountedRef.current) return
        if (fetchedList && fetchedList.length > 0) {
          setList(fetchedList)
        }
      })
    },
  }), [])

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.accentBar} />
            <Text style={styles.title} size={15} color="#0F172A">
              {t('search_hot_search')}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>大家都在搜</Text>
            </View>
          </View>
          {sourceName ? (
            <View style={styles.sourceTag}>
              <Icon name="hot" size={11} color="#10B981" />
              <Text style={styles.sourceTagText}>{sourceName}热度榜</Text>
            </View>
          ) : null}
        </View>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
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
    backgroundColor: '#10B981',
    borderRadius: 2,
    marginRight: 8,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  sourceTagText: {
    fontSize: 10.5,
    color: '#059669',
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
    borderRadius: 999,
    marginRight: 9,
    marginBottom: 10,
  },
  tagPillTop: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  tagPillNormal: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topBadge: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  topBadgeFirst: {
    backgroundColor: '#059669',
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
})
