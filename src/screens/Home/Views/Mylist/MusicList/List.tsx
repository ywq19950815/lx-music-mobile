import { playList } from '@/core/player/player'
import { useMemo, useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { FlatList, View, TouchableOpacity, StyleSheet, type NativeScrollEvent, type NativeSyntheticEvent, type FlatListProps } from 'react-native'

import listState from '@/store/list/state'
import playerState from '@/store/player/state'
import { getListPosition, getListPrevSelectId, saveListPosition } from '@/utils/data'
import { getListMusics, setActiveList } from '@/core/list'
import ListItem, { ITEM_HEIGHT } from './ListItem'
import { getRowInfo } from '@/utils/tools'
import { usePlayInfo, usePlayMusicInfo } from '@/store/player/hook'
import type { Position } from './ListMenu'
import type { SelectMode } from './MultipleModeBar'
import { useActiveListId } from '@/store/list/hook'
import { useSettingValue } from '@/store/setting/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { colors } from '@/theme/tokens'
import { LIST_IDS } from '@/config/constant'
import { scaleSizeH } from '@/utils/pixelRatio'

type FlatListType = FlatListProps<LX.Music.MusicInfo>

const HEADER_HEIGHT = scaleSizeH(46)

export interface ListProps {
  onShowMenu: (musicInfo: LX.Music.MusicInfo, index: number, position: Position) => void
  onMuiltSelectMode: () => void
  onSelectAll: (isAll: boolean) => void
}
export interface ListType {
  setIsMultiSelectMode: (isMultiSelectMode: boolean) => void
  setSelectMode: (mode: SelectMode) => void
  selectAll: (isAll: boolean) => void
  getSelectedList: () => LX.List.ListMusics
  scrollToInfo: (info: LX.Music.MusicInfo) => void
  scrollToTop: () => void
}

const usePlayIndex = () => {
  const activeListId = useActiveListId()
  const playMusicInfo = usePlayMusicInfo()
  const playInfo = usePlayInfo()

  const playIndex = useMemo(() => {
    return playMusicInfo.listId == activeListId ? playInfo.playIndex : -1
  }, [activeListId, playInfo.playIndex, playMusicInfo.listId])

  return playIndex
}


const List = forwardRef<ListType, ListProps>(({ onShowMenu, onMuiltSelectMode, onSelectAll }, ref) => {
  const flatListRef = useRef<FlatList>(null)
  const [currentList, setList] = useState<LX.List.ListMusics>([])
  const listFirstScrollRef = useRef(false)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const isMultiSelectModeRef = useRef(false)
  const selectModeRef = useRef<SelectMode>('single')
  const prevSelectIndexRef = useRef(-1)
  const [selectedList, setSelectedList] = useState<LX.List.ListMusics>([])
  const selectedListRef = useRef<LX.List.ListMusics>([])
  const currentListIdRef = useRef('')
  const waitJumpListPositionRef = useRef(false)
  const rowInfo = useRef(getRowInfo())
  const isShowAlbumName = useSettingValue('list.isShowAlbumName')
  const isShowInterval = useSettingValue('list.isShowInterval')

  useImperativeHandle(ref, () => ({
    setIsMultiSelectMode(mode) {
      isMultiSelectModeRef.current = mode
      setIsMultiSelectMode(mode)
      if (!mode) {
        prevSelectIndexRef.current = -1
        handleUpdateSelectedList([])
      }
    },
    setSelectMode(mode) {
      selectModeRef.current = mode
    },
    selectAll(isAll) {
      let list: LX.List.ListMusics
      if (isAll) {
        list = [...currentList]
      } else {
        list = []
      }
      selectedListRef.current = list
      setSelectedList(list)
    },
    getSelectedList() {
      return selectedListRef.current
    },
    scrollToInfo(info) {
      void getListMusics(listState.activeListId).then((list) => {
        const index = list.findIndex(m => m.id == info.id)
        if (index < 0) return
        flatListRef.current?.scrollToIndex({ index: Math.floor(index / (rowInfo.current.rowNum ?? 1)), viewPosition: 0.3, animated: true })
      })
    },
    scrollToTop() {
      flatListRef.current?.scrollToOffset({
        offset: 0,
        animated: true,
      })
    },
  }))

  useEffect(() => {
    let isUpdateingList = true
    const updateList = (id: string) => {
      if (currentListIdRef.current == id) return
      isUpdateingList = true
      setList([])
      currentListIdRef.current = id
      void Promise.all([getListMusics(id), getListPosition(id)]).then(([list, position]) => {
        requestAnimationFrame(() => {
          if (currentListIdRef.current != id) return
          selectedListRef.current = []
          setSelectedList([])
          setList([...list])
          requestAnimationFrame(() => {
            isUpdateingList = false
            listFirstScrollRef.current = true
            if (waitJumpListPositionRef.current) {
              waitJumpListPositionRef.current = false
              if (playerState.playMusicInfo.listId == id && playerState.playInfo.playIndex > -1) {
                try {
                  flatListRef.current?.scrollToIndex({ index: Math.floor(playerState.playInfo.playIndex / (rowInfo.current.rowNum ?? 1)), viewPosition: 0.3, animated: false })
                  return
                } catch {}
              }
            }
            flatListRef.current?.scrollToOffset({ offset: position, animated: false })
          })
        })
      })
    }
    const handleChange = (ids: string[]) => {
      if (!ids.includes(listState.activeListId)) return
      const id = listState.activeListId
      void getListMusics(id).then((list) => {
        if (currentListIdRef.current != id) return
        selectedListRef.current = []
        setSelectedList([])
        setList([...list])
      })
    }

    const handleJumpPosition = () => {
      requestAnimationFrame(() => {
        const listId = playerState.playMusicInfo.listId
        if (!listId) return
        if (listId != listState.activeListId) {
          setActiveList(listId)
          if (currentListIdRef.current != listId) waitJumpListPositionRef.current = true
        } else if (playerState.playInfo.playIndex > -1) {
          if (isUpdateingList) waitJumpListPositionRef.current = true
          else {
            try {
              flatListRef.current?.scrollToIndex({ index: Math.floor(playerState.playInfo.playIndex / (rowInfo.current.rowNum ?? 1)), viewPosition: 0.3, animated: true })
            } catch {}
          }
        }
      })
    }
    if (global.lx.jumpMyListPosition) {
      global.lx.jumpMyListPosition = false
      if (playerState.playMusicInfo.listId) {
        waitJumpListPositionRef.current = true
        updateList(playerState.playMusicInfo.listId)
      } else void getListPrevSelectId().then(updateList)
    } else void getListPrevSelectId().then(updateList)

    global.state_event.on('mylistToggled', updateList)
    global.app_event.on('myListMusicUpdate', handleChange)
    global.app_event.on('jumpListPosition', handleJumpPosition)

    return () => {
      global.state_event.off('mylistToggled', updateList)
      global.app_event.off('myListMusicUpdate', handleChange)
      global.app_event.off('jumpListPosition', handleJumpPosition)
    }
  }, [])

  const activeIndex = usePlayIndex()
  const handlePlay = (index: number) => {
    void playList(listState.activeListId, index)
  }

  const handlePlayAll = () => {
    if (currentList.length > 0) {
      handlePlay(0)
    }
  }

  const handleUpdateSelectedList = (newList: LX.List.ListMusics) => {
    if (selectedListRef.current.length && newList.length == currentList.length) onSelectAll(true)
    else if (selectedListRef.current.length == currentList.length) onSelectAll(false)
    selectedListRef.current = newList
    setSelectedList(newList)
  }
  const handleSelect = (item: LX.Music.MusicInfo, pressIndex: number) => {
    let newList: LX.List.ListMusics
    if (selectModeRef.current == 'single') {
      prevSelectIndexRef.current = pressIndex
      const index = selectedListRef.current.indexOf(item)
      if (index < 0) {
        newList = [...selectedListRef.current, item]
      } else {
        newList = [...selectedListRef.current]
        newList.splice(index, 1)
      }
    } else {
      if (selectedListRef.current.length) {
        const prevIndex = prevSelectIndexRef.current
        const currentIndex = pressIndex
        if (prevIndex == currentIndex) {
          newList = []
        } else if (currentIndex > prevIndex) {
          newList = currentList.slice(prevIndex, currentIndex + 1)
        } else {
          newList = currentList.slice(currentIndex, prevIndex + 1)
          newList.reverse()
        }
      } else {
        newList = [item]
        prevSelectIndexRef.current = pressIndex
      }
    }

    handleUpdateSelectedList(newList)
  }

  const handlePress = (item: LX.Music.MusicInfo, index: number) => {
    if (isMultiSelectModeRef.current) {
      handleSelect(item, index)
    } else {
      handlePlay(index)
    }
  }

  const handleLongPress = (item: LX.Music.MusicInfo, index: number) => {
    if (isMultiSelectModeRef.current) return
    prevSelectIndexRef.current = index
    handleUpdateSelectedList([item])
    onMuiltSelectMode()
  }

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (listFirstScrollRef.current) {
      listFirstScrollRef.current = false
      return
    }
    void saveListPosition(listState.activeListId, nativeEvent.contentOffset.y)
  }

  // QQ音乐标准通栏「播放全部」头部操作栏
  const renderHeader = () => {
    if (currentList.length === 0 || isMultiSelectMode) return null
    return (
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.playAllBtn}
          onPress={handlePlayAll}
          activeOpacity={0.7}
        >
          <View style={styles.playAllIconBox}>
            <Icon name="play" size={11} color="#FFFFFF" />
          </View>
          <Text style={styles.playAllTitle}>播放全部</Text>
          <Text style={styles.playAllCount}>(共 {currentList.length} 首)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.multiSelectBtn}
          onPress={onMuiltSelectMode}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="checkbox" size={15} color="#64748B" />
          <Text style={styles.multiSelectText}>多选</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // QQ音乐质感空状态引导
  const renderEmpty = () => {
    const isLove = listState.activeListId === LIST_IDS.LOVE
    const isTemp = listState.activeListId === LIST_IDS.TEMP || listState.activeListId === LIST_IDS.DEFAULT
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconCircle, isLove && styles.emptyIconLove]}>
          <Icon
            name={isLove ? 'love' : isTemp ? 'history' : 'logo'}
            size={32}
            color={isLove ? '#EF4444' : colors.brand}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {isLove ? '暂无收藏歌曲' : isTemp ? '暂无最近播放歌曲' : '歌单暂无歌曲'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isLove
            ? '去发现或排行榜中听歌，点击爱心即可收藏'
            : isTemp
            ? '播放任意歌曲后，将自动记录在最近播放列表中'
            : '可通过搜索或外部文件导入歌曲'}
        </Text>
      </View>
    )
  }

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      activeIndex={activeIndex}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onShowMenu={onShowMenu}
      selectedList={selectedList}
      rowInfo={rowInfo.current}
      isShowAlbumName={isShowAlbumName}
      isShowInterval={isShowInterval}
      isMultiSelectMode={isMultiSelectMode}
    />
  )

  const getkey: FlatListType['keyExtractor'] = item => item.id
  const getItemLayout: FlatListType['getItemLayout'] = (data, index) => {
    const headerOffset = (!isMultiSelectMode && currentList.length > 0) ? HEADER_HEIGHT : 0
    return { length: ITEM_HEIGHT, offset: headerOffset + ITEM_HEIGHT * index, index }
  }

  return (
    <FlatList
      ref={flatListRef}
      onScroll={handleScroll}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={currentList}
      maxToRenderPerBatch={6}
      numColumns={rowInfo.current.rowNum}
      horizontal={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      scrollEventThrottle={16}
      windowSize={10}
      removeClippedSubviews={true}
      initialNumToRender={14}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      renderItem={renderItem}
      keyExtractor={getkey}
      extraData={`${activeIndex}_${isMultiSelectMode}_${selectedList.length}`}
      getItemLayout={getItemLayout}
    />
  )
})

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 90,
  },
  // 通栏「播放全部」操作行
  headerBar: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  playAllIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  playAllTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  playAllCount: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  multiSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    gap: 4,
  },
  multiSelectText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '600',
  },
  // 空状态
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(49, 194, 124, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconLove: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
  },
})

export default List
