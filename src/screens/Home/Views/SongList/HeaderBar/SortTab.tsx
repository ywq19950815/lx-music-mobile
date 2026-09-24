import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import songlistState, { type SortInfo, type Source } from '@/store/songlist/state'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { colors } from '@/theme/tokens'

export interface SortTabProps {
  onSortChange: (id: string) => void
}

export interface SortTabType {
  setSource: (source: Source, activeTab: SortInfo['id']) => void
}

/**
 * 歌单分类切换条：现代微胶囊风格。
 * 激活项带有浅金底色、细金边与高亮金文字。
 */
export default forwardRef<SortTabType, SortTabProps>(({ onSortChange }, ref) => {
  const [sortList, setSortList] = useState<SortInfo[]>([])
  const [activeId, setActiveId] = useState<SortInfo['id']>('')
  const t = useI18n()
  const scrollViewRef = useRef<ScrollView>(null)

  useImperativeHandle(ref, () => ({
    setSource(source, activeTab) {
      scrollViewRef.current?.scrollTo({ x: 0 })
      setSortList(songlistState.sortList[source]!)
      setActiveId(activeTab)
    },
  }))

  const sorts = useMemo(() => {
    return sortList.map(s => ({ label: t(`songlist_${s.tid}`), id: s.id }))
  }, [sortList, t])

  const handleSortChange = (id: string) => {
    onSortChange(id)
    setActiveId(id)
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="always"
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {sorts.map(s => {
        const active = activeId === s.id
        return (
          <TouchableOpacity
            key={s.id}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => handleSortChange(s.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
  },
  content: {
    alignItems: 'center',
    paddingLeft: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderColor: '#F5A623',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5A616B',
  },
  pillTextActive: {
    fontWeight: '700',
    color: '#B36B00',
  },
})
