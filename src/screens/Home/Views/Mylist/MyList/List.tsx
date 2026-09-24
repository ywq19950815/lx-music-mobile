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
import { colors, radius } from '@/theme/tokens'

type FlatListType = FlatListProps<LX.List.MyListInfo>

const ITEM_HEIGHT = scaleSizeH(56)

/**
 * 现代轻量化歌单选择卡片：
 * - 柔和微圆角与极浅边框
 * - 选中态微透暖金背景与品牌色图标
 * - 移除硬阴影与粗黑描边
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
      <TouchableOpacity
        style={[styles.cardBody, active ? styles.cardActive : styles.cardDefault]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={[styles.leftIconBox, active ? styles.leftIconBoxActive : styles.leftIconBoxDefault]}>
          <Icon
            name={active ? 'play' : 'album'}
            size={14}
            color={active ? '#FFFFFF' : colors.inkSecondary}
          />
        </View>

        {fetching ? <Loading color={colors.brand} style={styles.loading} /> : null}

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
          <Icon name="dots-vertical" color={colors.inkTertiary} size={15} />
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
    paddingHorizontal: 8,
  },
  itemWrapper: {
    marginVertical: 3,
    height: 48,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardActive: {
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
    borderColor: 'rgba(245, 166, 35, 0.35)',
  },
  cardDefault: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
  },
  leftIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  leftIconBoxActive: {
    backgroundColor: colors.brand,
  },
  leftIconBoxDefault: {
    backgroundColor: '#F3F4F6',
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
  },
  listNameActive: {
    color: '#B36B00',
    fontWeight: '700',
  },
  listNameDefault: {
    color: colors.ink,
    fontWeight: '600',
  },
  moreBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
