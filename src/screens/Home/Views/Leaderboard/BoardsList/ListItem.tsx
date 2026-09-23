import { useCallback, useRef } from 'react'
import { StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import Button, { type BtnType } from '@/components/common/Button'
import { type BoardItem } from '@/store/leaderboard/state'
import { Icon } from '@/components/common/Icon'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

export interface ListItemProps {
  item: BoardItem
  index: number
  longPressIndex: number
  activeId: string
  onShowMenu: (id: string, name: string, index: number, position: { x: number, y: number, w: number, h: number }) => void
  onBoundChange: (item: BoardItem) => void
}

export default ({ item, activeId, index, onBoundChange, onShowMenu }: ListItemProps) => {
  const buttonRef = useRef<BtnType>(null)

  const setPosition = useCallback(() => {
    if (buttonRef.current?.measure) {
      buttonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMenu(item.id, item.name, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }, [index, item, onShowMenu])

  const active = activeId === item.id

  return (
    <Button
      ref={buttonRef}
      style={[
        styles.button,
        active ? styles.buttonActive : styles.buttonInactive,
      ]}
      key={item.id}
      onLongPress={setPosition}
      onPress={() => {
        onBoundChange(item)
      }}
    >
      {active ? (
        <Icon style={styles.listActiveIcon} name="chevron-right" size={13} color={neoColors.black} />
      ) : null}
      <Text
        style={[styles.listName, active && styles.listNameActive]}
        size={13}
        numberOfLines={1}
      >
        {item.name}
      </Text>
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: neoBorders.radiusPill,
    marginHorizontal: 4,
    marginVertical: 4,
    borderWidth: 2,
  },
  buttonActive: {
    backgroundColor: neoColors.yellow,
    borderColor: neoColors.black,
    shadowColor: neoColors.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  buttonInactive: {
    backgroundColor: neoColors.white,
    borderColor: neoColors.black,
  },
  listActiveIcon: {
    marginRight: 4,
  },
  listName: {
    fontWeight: '800',
    color: neoColors.black,
  },
  listNameActive: {
    fontWeight: '900',
  },
})
