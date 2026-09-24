import { useRef, useImperativeHandle, forwardRef, useState, useEffect, useCallback } from 'react'
import SearchTipList, { type SearchTipListProps as _SearchTipListProps, type SearchTipListType } from '@/components/SearchTipList'
import { debounce } from '@/utils'
import { searchListMusic } from './listAction'
import Button from '@/components/common/Button'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { StyleSheet, View } from 'react-native'
import { scaleSizeH } from '@/utils/pixelRatio'
import { getListMusics } from '@/core/list'
import listState from '@/store/list/state'
import { colors } from '@/theme/tokens'

type SearchTipListProps = _SearchTipListProps<LX.Music.MusicInfo>
interface ListMusicSearchProps {
  onScrollToInfo: (info: LX.Music.MusicInfo) => void
}
export const ITEM_HEIGHT = scaleSizeH(46)

export interface ListMusicSearchType {
  search: (keyword: string, height: number) => void
  hide: () => void
}

export const debounceSearchList = debounce((text: string, list: LX.List.ListMusics, callback: (list: LX.List.ListMusics) => void) => {
  callback(searchListMusic(list, text))
}, 200)

export default forwardRef<ListMusicSearchType, ListMusicSearchProps>(({ onScrollToInfo }, ref) => {
  const searchTipListRef = useRef<SearchTipListType<LX.Music.MusicInfo>>(null)
  const [visible, setVisible] = useState(false)
  const visibleRef = useRef(false)
  const currentListIdRef = useRef('')
  const currentKeywordRef = useRef('')
  const pendingRef = useRef<{ keyword: string, height: number } | null>(null)

  const handleShowList = useCallback((keyword: string, height: number) => {
    const tipList = searchTipListRef.current
    if (!tipList) {
      pendingRef.current = { keyword, height }
      return
    }
    tipList.setHeight(height)
    currentKeywordRef.current = keyword
    const id = currentListIdRef.current = listState.activeListId
    if (keyword) {
      void getListMusics(id).then(list => {
        debounceSearchList(keyword, list, (list) => {
          if (currentListIdRef.current != id) return
          searchTipListRef.current?.setList(list)
        })
      })
    } else {
      tipList.setList([])
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    const pending = pendingRef.current
    if (!pending || !searchTipListRef.current) return
    pendingRef.current = null
    handleShowList(pending.keyword, pending.height)
  }, [visible, handleShowList])

  useImperativeHandle(ref, () => ({
    search(keyword, height) {
      if (!visibleRef.current) {
        visibleRef.current = true
        setVisible(true)
      }
      handleShowList(keyword, height)
    },
    hide() {
      visibleRef.current = false
      currentKeywordRef.current = ''
      currentListIdRef.current = ''
      pendingRef.current = null
      searchTipListRef.current?.setList([])
    },
  }), [handleShowList])

  useEffect(() => {
    const updateList = (id: string) => {
      currentListIdRef.current = id
      if (!currentKeywordRef.current) return
      void getListMusics(listState.activeListId).then(list => {
        debounceSearchList(currentKeywordRef.current, list, (list) => {
          if (currentListIdRef.current != id) return
          searchTipListRef.current?.setList(list)
        })
      })
    }
    const handleChange = (ids: string[]) => {
      if (!ids.includes(listState.activeListId)) return
      updateList(listState.activeListId)
    }

    global.state_event.on('mylistToggled', updateList)
    global.app_event.on('myListMusicUpdate', handleChange)

    return () => {
      global.state_event.off('mylistToggled', updateList)
      global.app_event.off('myListMusicUpdate', handleChange)
    }
  }, [])

  const renderItem = ({ item, index }: { item: LX.Music.MusicInfo, index: number }) => {
    return (
      <Button style={styles.item} onPress={() => { onScrollToInfo(item) }} key={index}>
        <View style={styles.itemName}>
          <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
          <Text style={styles.subName} numberOfLines={1} size={12} color={colors.inkSecondary}>{item.singer} ({item.meta.albumName})</Text>
        </View>
        <Text style={styles.itemSource} size={10}>{item.source?.toUpperCase()}</Text>
      </Button>
    )
  }
  const getkey: SearchTipListProps['keyExtractor'] = item => item.id
  const getItemLayout: SearchTipListProps['getItemLayout'] = (data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }

  return (
    visible
      ? <SearchTipList
          ref={searchTipListRef}
          renderItem={renderItem}
          onPressBg={() => searchTipListRef.current?.setList([])}
          keyExtractor={getkey}
          getItemLayout={getItemLayout}
        />
      : null
  )
})

const styles = createStyle({
  item: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEEF1',
  },
  itemName: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: '600',
    color: colors.ink,
  },
  subName: {
    marginTop: 2,
  },
  itemSource: {
    flexGrow: 0,
    flexShrink: 0,
    marginLeft: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    fontWeight: '600',
    color: colors.inkTertiary,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
})

