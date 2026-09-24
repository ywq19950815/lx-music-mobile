import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { type Source, type InitState } from '@/store/hotSearch/state'
import { getList } from '@/core/hotSearch'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'

interface ListProps {
  onSearch: (keyword: string) => void
}
export interface HotSearchType {
  show: (source: Source) => void
}

export type List = NonNullable<InitState['sourceList'][keyof InitState['sourceList']]>

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
        <View style={styles.topBadge}>
          <Text size={9.5} color="#FFFFFF" style={styles.topBadgeText}>
            {index + 1}
          </Text>
        </View>
      )}
      <Text
        style={styles.tagText}
        size={12}
        color={isTop3 ? '#B36B00' : '#2C3038'}
      >
        {keyword}
      </Text>
    </TouchableOpacity>
  )
}

export default forwardRef<HotSearchType, ListProps>((props, ref) => {
  const [list, setList] = useState<List>([])
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
      void getList(source).then((list) => {
        if (isUnmountedRef.current) return
        setList(list)
      })
    },
  }), [])

  return (
    list.length
      ? (
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.accentBar} />
              <Text style={styles.title} size={14} color="#1A1C20">
                {t('search_hot_search')}
              </Text>
            </View>
            <View style={styles.list}>
              {
                list.map((keyword, idx) => (
                  <ListItem
                    keyword={keyword}
                    index={idx}
                    key={keyword}
                    onSearch={props.onSearch}
                  />
                ))
              }
            </View>
          </View>
        )
      : null
  )
})

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accentBar: {
    width: 3.5,
    height: 13,
    backgroundColor: '#F5A623',
    borderRadius: 2,
    marginRight: 7,
  },
  title: {
    fontWeight: '700',
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagPillTop: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.3)',
  },
  tagPillNormal: {
    backgroundColor: '#F3F4F7',
    borderWidth: 1,
    borderColor: '#E8EAEE',
  },
  topBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F5A623',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  topBadgeText: {
    fontWeight: '800',
    lineHeight: 12,
  },
  tagText: {
    fontWeight: '500',
  },
})
