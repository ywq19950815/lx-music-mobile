import { useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import { FlatList, View, RefreshControl, type FlatListProps } from 'react-native'

import ListItem from './ListItem'
// import { navigations } from '@/navigation'
import { type ListInfoItem } from '@/store/songlist/state'
import { useLayout } from '@/utils/hooks'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { scaleSizeW } from '@/utils/pixelRatio'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

type FlatListType = FlatListProps<ListInfoItem>

// 卡片之间的水平间距（= ListItem 左右 margin 之和，即 scaleSizeW(6) * 2）
const GAP = scaleSizeW(12)
// 列表左右内边距。
// ⚠️ 只允许在一处生效：必须写在 contentContainerStyle 上，不能写在 FlatList 的 style 上。
//    RNW 会把 FlatList 的 style 同时应用到 ScrollView 外层容器与内容容器，
//    写在 style 上会被叠加成双倍 padding（实测 10 → 左右各 20），
//    导致手工算出的卡片总宽 373 > 真实可用内容宽 353，横向溢出后被 overflow:hidden 裁掉右描边与硬阴影。
const LIST_PADDING = 10
// 单张卡片封面的最小宽度，用于反推一行最多能放几张。
// 注意：判定一行能放几张时，每张卡片还要额外占用 GAP 的间距，故按 MIN_WIDTH + GAP 计算。
const MIN_WIDTH = scaleSizeW(95)
// 每行卡片数的上下限，避免极窄/极宽容器下列表退化
const MIN_COLUMNS = 3
const MAX_COLUMNS = 6

export interface ListProps {
  onRefresh: () => void
  onLoadMore: () => void
  onOpenDetail: (item: ListInfoItem, index: number) => void
}
export type Status = 'loading' | 'refreshing' | 'end' | 'error' | 'idle'

export interface ListType {
  setList: (list: ListInfoItem[], showSource?: boolean) => void
  setStatus: (val: Status) => void
}

export default forwardRef<ListType, ListProps>(({ onRefresh, onLoadMore, onOpenDetail }, ref) => {
  const flatListRef = useRef<FlatList>(null)
  const [currentList, setList] = useState<ListInfoItem[]>([])
  const [showSource, setShowSource] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const { onLayout, width } = useLayout()
  const theme = useTheme()
  // console.log('render songlist')
  useImperativeHandle(ref, () => ({
    setList(list, showSource = false) {
      // rawListRef.current = list
      setList(list)
      setShowSource(showSource)
    },
    setStatus(val) {
      setStatus(val)
    },
  }))

  const handleLoadMore = () => {
    if (status != 'idle') return
    onLoadMore()
  }

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      showSource={showSource}
      onPress={onOpenDetail}
    />
  )
  const getkey: FlatListType['keyExtractor'] = item => item.id
  // const getItemLayout: FlatListType['getItemLayout'] = (data, index) => {
  //   return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  // }
  const refreshControl = useMemo(() => (
    <RefreshControl
      colors={[theme['c-primary']]}
      // progressBackgroundColor={theme.primary}
      refreshing={status == 'refreshing'}
      onRefresh={onRefresh} />
  ), [status, onRefresh, theme])
  const footerComponent = useMemo(() => {
    let label: FooterLabel
    switch (status) {
      case 'refreshing': return null
      case 'loading':
        label = 'list_loading'
        break
      case 'end':
        label = 'list_end'
        break
      case 'error':
        label = 'list_error'
        break
      case 'idle':
        label = null
        break
    }
    return (
      <View style={{ width: '100%' }}>
        <Footer label={label} onLoadMore={onLoadMore} />
      </View>
    )
  }, [onLoadMore, status])


  // const itemWidth = useMemo(() => {
  //   let itemWidth = Math.max(Math.trunc(width * 0.125), MAX_WIDTH)
  //   // if (itemWidth < )
  // }, [width])
  // const computedItemWidth = useMemo(() => {
  //   let w = width - GAP
  //   let n = width / (MIN_WIDTH + GAP)
  //   if (n > 10) n = 10
  //   return Math.floor(w / n)
  // }, [width])
  // console.log(Math.trunc(width * 0.125), itemWidth)
  // console.log(itemWidth, MIN_WIDTH, GAP, width)
  // 只计算「每行放几列」，卡片宽度不再手算像素：
  // 交给 ListItem 的 flex: 1 由 row 容器自动均分（天然不会溢出，也不依赖 padding 叠加层数）。
  const columnCount = useMemo(() => {
    // 容器宽度 - 列表左右内边距 = 每行可用的内容宽度
    const contentWidth = width - LIST_PADDING * 2
    if (contentWidth <= 0) return MIN_COLUMNS
    // 一行最多放下几张「含间距的最小卡片」
    const count = Math.floor((contentWidth + GAP) / (MIN_WIDTH + GAP))
    return Math.min(Math.max(count, MIN_COLUMNS), MAX_COLUMNS)
  }, [width])
  const list = useMemo(() => {
    const list = [...currentList]
    let whiteItemNum = (list.length % columnCount)
    if (whiteItemNum > 0) whiteItemNum = columnCount - whiteItemNum
    for (let i = 0; i < whiteItemNum; i++) {
      list.push({
        id: `white__${i}`,
        play_count: '',
        author: '',
        name: '',
        img: '',
        desc: '',
        // @ts-expect-error
        source: '',
      })
    }
    return list
  }, [currentList, columnCount])
  // console.log(listInfo.list.map((item) => item.id))

  return (
    <View style={styles.container} onLayout={onLayout}>
      {
        width == 0
          ? null
          : (
              <FlatList
                key={String(columnCount)}
                ref={flatListRef}
                style={styles.list}
                contentContainerStyle={styles.contentContainer}
                columnWrapperStyle={styles.columnWrapper}
                numColumns={columnCount}
                data={list}
                // App 靠手指滑动浏览，隐藏 Web 滚动条并保持滚动跟手
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                scrollEventThrottle={16}
                maxToRenderPerBatch={4}
                // updateCellsBatchingPeriod={80}
                windowSize={8}
                removeClippedSubviews={true}
                // initialNumToRender={12}
                renderItem={renderItem}
                keyExtractor={getkey}
                // getItemLayout={getItemLayout}
                // onRefresh={onRefresh}
                // refreshing={refreshing}
                onEndReachedThreshold={0.6}
                onEndReached={handleLoadMore}
                refreshControl={refreshControl}
                ListFooterComponent={footerComponent}
              />
            )
      }
    </View>
  )
})

type FooterLabel = 'list_loading' | 'list_end' | 'list_error' | null
const Footer = ({ label, onLoadMore }: {
  label: FooterLabel
  onLoadMore: () => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const handlePress = () => {
    if (label != 'list_error') return
    onLoadMore()
  }
  return (
    label
      ? (
          <View>
            <Text onPress={handlePress} style={styles.footer} color={theme['c-font-label']}>{t(label)}</Text>
          </View>
        )
      : null
  )
}


const styles = createStyle({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
    // 注意：横向 padding 只能声明在 contentContainer 上，写在这里会被 RNW 叠加两次。
  },
  contentContainer: {
    paddingHorizontal: LIST_PADDING,
    paddingBottom: 90,
  },
  // flex: 1 的卡片会占满剩余空间，本项仅在「卡片宽度尚未算出」时兜底排版
  columnWrapper: {
    justifyContent: 'space-evenly',
  },
  footer: {
    textAlign: 'center',
    padding: 10,
  },
})
