import { memo, useEffect, useRef } from 'react'
import { View, TouchableOpacity, FlatList, type NativeScrollEvent, type NativeSyntheticEvent, type FlatListProps, StyleSheet } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { useActiveListId, useListFetching, useMyList } from '@/store/list/hook'
import { LIST_SCROLL_POSITION_KEY } from '@/config/constant'
import { getListPosition, saveListPosition } from '@/utils/data'
import { setActiveList } from '@/core/list'
import Text from '@/components/common/Text'
import { type Position } from './ListMenu'
import { scaleSizeH } from '@/utils/pixelRatio'
import Loading from '@/components/common/Loading'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

type FlatListType = FlatListProps<LX.List.MyListInfo>

const ITEM_HEIGHT = scaleSizeH(56)

/**
 * NeoPlaylistItem: 新粗野主义风格的歌单选择卡片。
 * - 纯黑 2px 边框
 * - 纯黑 3px 硬阴影
 * - 选中态为亮黄色实体卡片
 */
const ListItem = memo(({ item, index, activeId, onPress, onShowMenu }: {
  onPress: (item: LX.List.MyListInfo) => void
  index: number
  activeId: string
  item: LX.List.MyListInfo
  onShowMenu: (item: LX.List.MyListInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
}) => {
  const moreButtonRef = useRef<TouchableOpacity>(null)
  const fetching = useListFetching(item.id)
  const active = activeId === item.id

  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }

  const handlePress = () => {
    onPress(item)
  }

  return (
    <View style={styles.itemWrapper}>
      {/* 背后纯黑实体硬投影底座 */}
      <View style={styles.cardShadow} />

      {/* 前台波普卡片 */}
      <TouchableOpacity
        style={[styles.cardBody, active ? styles.cardActive : styles.cardDefault]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.leftIconBox}>
          <Icon
            name={active ? 'play' : 'album'}
            size={16}
            color={neoColors.black}
          />
        </View>

        {fetching ? <Loading color={neoColors.black} style={styles.loading} /> : null}

        <View style={styles.nameBox}>
          <Text
            numberOfLines={1}
            style={[styles.listNameText, active ? styles.listNameActive : styles.listNameDefault]}
          >
            {item.name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleShowMenu}
          ref={moreButtonRef}
          style={styles.moreBtn}
          activeOpacity={0.6}
        >
          <Icon name="dots-vertical" color={neoColors.black} size={14} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.activeId !== nextProps.item.id &&
    nextProps.activeId !== nextProps.item.id
  )
})

export default ({ onShowMenu }: {
  onShowMenu: (info: { listInfo: LX.List.MyListInfo, index: number }, position: Position) => void
}) => {
  const flatListRef = useRef<FlatList>(null)
  const allList = useMyList()
  const activeListId = useActiveListId()

  const handleToggleList = (item: LX.List.MyListInfo) => {
    global.app_event.changeLoveListVisible(false)
    requestAnimationFrame(() => {
      setActiveList(item.id)
    })
  }

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    void saveListPosition(LIST_SCROLL_POSITION_KEY, nativeEvent.contentOffset.y)
  }

  const showMenu = (listInfo: LX.List.MyListInfo, index: number, position: Position) => {
    onShowMenu({ listInfo, index }, position)
  }

  useEffect(() => {
    void getListPosition(LIST_SCROLL_POSITION_KEY).then((offset) => {
      flatListRef.current?.scrollToOffset({ offset, animated: false })
    })
  }, [])

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      key={item.id}
      item={item}
      index={index}
      activeId={activeListId}
      onPress={handleToggleList}
      onShowMenu={showMenu}
    />
  )
  const getkey: FlatListType['keyExtractor'] = item => item.id
  const getItemLayout: FlatListType['getItemLayout'] = (data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }

  return (
    <FlatList
      ref={flatListRef}
      onScroll={handleScroll}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      data={allList}
      // App 靠手指滑动浏览，隐藏 Web 滚动条并保持滚动跟手
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      scrollEventThrottle={16}
      maxToRenderPerBatch={9}
      windowSize={9}
      removeClippedSubviews={true}
      initialNumToRender={18}
      renderItem={renderItem}
      keyExtractor={getkey}
      getItemLayout={getItemLayout}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  itemWrapper: {
    position: 'relative',
    marginVertical: 4,
    height: 48,
  },
  cardShadow: {
    position: 'absolute',
    left: 2,
    right: -2,
    top: 2,
    bottom: -2,
    backgroundColor: neoColors.black,
    borderRadius: neoBorders.radiusSm,
    zIndex: 0,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: neoBorders.radiusSm,
    borderWidth: 2,
    borderColor: neoColors.black,
    zIndex: 1,
  },
  cardActive: {
    backgroundColor: neoColors.yellow,
  },
  cardDefault: {
    backgroundColor: neoColors.white,
  },
  leftIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: neoColors.offWhite,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  loading: {
    marginRight: 6,
  },
  nameBox: {
    flex: 1,
    justifyContent: 'center',
  },
  listNameText: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  listNameActive: {
    color: neoColors.black,
    fontWeight: '900',
  },
  listNameDefault: {
    color: neoColors.black,
    fontWeight: '700',
  },
  moreBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: neoColors.offWhite,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
