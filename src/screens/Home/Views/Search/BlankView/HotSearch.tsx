import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View, TouchableOpacity, StyleSheet } from 'react-native'
import { type Source, type InitState } from '@/store/hotSearch/state'
import { getList } from '@/core/hotSearch'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

interface ListProps {
  onSearch: (keyword: string) => void
}
export interface HotSearchType {
  show: (source: Source) => void
}

export type List = NonNullable<InitState['sourceList'][keyof InitState['sourceList']]>

const POP_COLORS = [
  neoColors.yellow,
  neoColors.cyan,
  neoColors.pink,
  neoColors.green,
  neoColors.purple,
]

const ListItem = ({ keyword, index, onSearch }: {
  keyword: string
  index: number
  onSearch: (keyword: string) => void
}) => {
  const bg = POP_COLORS[index % POP_COLORS.length]

  return (
    <TouchableOpacity
      style={[styles.tagPill, { backgroundColor: bg }]}
      activeOpacity={0.7}
      onPress={() => { onSearch(keyword) }}
    >
      <Text style={styles.tagText} size={12} color={neoColors.black}>
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
              <View style={styles.accentDot} />
              <Text style={styles.title} size={15} color={neoColors.black}>
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
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  accentDot: {
    width: 8,
    height: 8,
    backgroundColor: neoColors.yellow,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    marginRight: 6,
    borderRadius: 2,
  },
  title: {
    fontWeight: '900',
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: neoBorders.radiusPill,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    marginRight: 8,
    marginBottom: 8,
    ...neoShadows.sm,
  },
  tagText: {
    fontWeight: '800',
  },
})
