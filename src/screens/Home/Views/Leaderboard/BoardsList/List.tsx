import { forwardRef, useImperativeHandle, useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'

import Text from '@/components/common/Text'
import { type Position } from './ListMenu'
import ListItem, { type ListItemProps } from './ListItem'
import boardState, { type BoardItem } from '@/store/leaderboard/state'
import { getBoardsList } from '@/core/leaderboard'
import { colors } from '@/theme/tokens'

export interface ListProps {
  onBoundChange: (listId: string, name?: string) => void
  onShowMenu: (info: { listId: string, name: string, index: number }, position: Position) => void
}
export interface ListType {
  setList: (list: BoardItem[], activeId: string) => void
  hideMenu: () => void
}

export default forwardRef<ListType, ListProps>(({ onBoundChange, onShowMenu }, ref) => {
  const [activeId, setActiveId] = useState('')
  const [longPressIndex, setLongPressIndex] = useState(-1)
  const [list, setList] = useState<BoardItem[]>([])

  useImperativeHandle(ref, () => ({
    setList(list, activeId) {
      setList(list)
      setActiveId(activeId)
    },
    hideMenu() {
      setLongPressIndex(-1)
    },
  }), [])

  useEffect(() => {
    // 如果挂载时列表为空，主动从 boardState 或核心获取填充
    if (!list.length) {
      const source = boardState.listDetailInfo.source || 'kw'
      const cached = boardState.boards[source]
      if (cached?.list?.length) {
        setList(cached.list)
        setActiveId(boardState.listDetailInfo.id || cached.list[0].id)
      } else {
        void getBoardsList(source).then(res => {
          if (res?.length) {
            setList(res)
            setActiveId(boardState.listDetailInfo.id || res[0].id)
          }
        })
      }
    }
  }, [list.length])

  const handleBoundChange = (item: BoardItem) => {
    setActiveId(item.id)
    onBoundChange(item.id, item.name)
  }

  const handleShowMenu: ListItemProps['onShowMenu'] = (listId, name, index, position: Position) => {
    setLongPressIndex(index)
    onShowMenu({ listId, name, index }, position)
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps={'always'}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.subHeader}>
        <Text style={styles.subTitle}>官方榜单</Text>
        <Text style={styles.subDesc}>共 {list.length} 个 · 长按项快捷操作</Text>
      </View>
      <View style={styles.gridContainer}>
        {
          list.map((item, index) => {
            return (
              <ListItem
                key={item.id}
                item={item}
                index={index}
                longPressIndex={longPressIndex}
                activeId={activeId}
                onShowMenu={handleShowMenu}
                onBoundChange={handleBoundChange}
              />
            )
          })
        }
      </View>
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  scrollView: {
    flexShrink: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 8,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A92A0',
    letterSpacing: 0.5,
  },
  subDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
})
