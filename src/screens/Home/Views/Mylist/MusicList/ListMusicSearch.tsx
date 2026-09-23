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
import { neoColors, neoBorders } from '@/theme/neobrutalism'

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
  // console.log(reslutList)
  callback(searchListMusic(list, text))
}, 200)


export default forwardRef<ListMusicSearchType, ListMusicSearchProps>(({ onScrollToInfo }, ref) => {
  const searchTipListRef = useRef<SearchTipListType<LX.Music.MusicInfo>>(null)
  const [visible, setVisible] = useState(false)
  const visibleRef = useRef(false)
  const currentListIdRef = useRef('')
  const currentKeywordRef = useRef('')
  // 待处理的首屏搜索请求：SearchTipList 挂载完成前 ref 为空，
  // 直接调用会丢数据导致「搜了没反应」，先缓存下来等挂载后再执行
  const pendingRef = useRef<{ keyword: string, height: number } | null>(null)

  const handleShowList = useCallback((keyword: string, height: number) => {
    const tipList = searchTipListRef.current
    // SearchTipList 尚未挂载（首次搜索），暂存请求，等它的 ref 就绪后再处理
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

  // SearchTipList 挂载后，补执行期间缓存的搜索请求。
  // 首次搜索时 SearchTipList 还没 commit，ref 为 null，直接调用会丢数据。
  useEffect(() => {
    if (!visible) return
    const pending = pendingRef.current
    if (!pending || !searchTipListRef.current) return
    pendingRef.current = null
    handleShowList(pending.keyword, pending.height)
  }, [visible, handleShowList])

  useImperativeHandle(ref, () => ({
    search(keyword, height) {
      // 用 ref 记录可见态，避免让 useImperativeHandle 依赖 state 引发无意义重建
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
          <Text style={styles.subName} numberOfLines={1} size={12} color={neoColors.gray700}>{item.singer} ({item.meta.albumName})</Text>
        </View>
        <Text style={styles.itemSource} size={11}>{item.source?.toUpperCase()}</Text>
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
    borderBottomColor: neoColors.gray200,
  },
  itemName: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: '800',
    color: neoColors.black,
  },
  subName: {
    marginTop: 2,
  },
  itemSource: {
    flexGrow: 0,
    flexShrink: 0,
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    fontWeight: '900',
    color: neoColors.black,
    backgroundColor: neoColors.cyan,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusPill,
    overflow: 'hidden',
  },
})

