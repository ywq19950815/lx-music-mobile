import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { type InitState } from '@/store/hotSearch/state'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { clearHistoryList, getSearchHistory, removeHistoryWord } from '@/core/search/search'
import { Icon } from '@/components/common/Icon'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

export type List = NonNullable<InitState['sourceList'][keyof InitState['sourceList']]>

const ListItem = ({ keyword, onSearch, onRemove }: {
  keyword: string
  onSearch: (keyword: string) => void
  onRemove: (keyword: string) => void
}) => {
  return (
    <TouchableOpacity
      style={styles.historyPill}
      activeOpacity={0.7}
      onPress={() => { onSearch(keyword) }}
      onLongPress={() => { onRemove(keyword) }}
    >
      <Text style={styles.pillText} size={12} color={neoColors.black}>
        {keyword}
      </Text>
    </TouchableOpacity>
  )
}

interface HistorySearchProps {
  onSearch: (keyword: string) => void
}
export interface HistorySearchType {
  show: () => void
}

export default forwardRef<HistorySearchType, HistorySearchProps>((props, ref) => {
  const [list, setList] = useState<List>([])
  const isUnmountedRef = useRef(false)
  const t = useI18n()

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  useImperativeHandle(ref, () => ({
    show() {
      void getSearchHistory().then((list) => {
        if (isUnmountedRef.current) return
        setList(list)
      })
    },
  }), [])

  const handleClear = () => {
    clearHistoryList()
    setList([])
  }

  const handleRemove = useCallback((keyword: string) => {
    setList(list => {
      list = [...list]
      const index = list.indexOf(keyword)
      list.splice(index, 1)
      removeHistoryWord(index)
      return list
    })
  }, [])

  return (
    list.length
      ? (
          <View style={styles.container}>
            <View style={styles.titleContent}>
              <View style={styles.accentDot} />
              <Text style={styles.title} size={15} color={neoColors.black}>
                {t('search_history_search')}
              </Text>
              <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
                <Icon name="eraser" color={neoColors.black} size={12} />
              </TouchableOpacity>
            </View>
            <View style={styles.list}>
              {
                list.map(keyword => (
                  <ListItem
                    keyword={keyword}
                    key={keyword}
                    onSearch={props.onSearch}
                    onRemove={handleRemove}
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
    paddingTop: 14,
    paddingBottom: 8,
  },
  titleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  accentDot: {
    width: 8,
    height: 8,
    backgroundColor: neoColors.cyan,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    marginRight: 6,
    borderRadius: 2,
  },
  title: {
    fontWeight: '900',
  },
  clearBtn: {
    marginLeft: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    backgroundColor: neoColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...neoShadows.sm,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  historyPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: neoBorders.radiusPill,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    backgroundColor: neoColors.white,
    marginRight: 8,
    marginBottom: 8,
    ...neoShadows.sm,
  },
  pillText: {
    fontWeight: '700',
  },
})
