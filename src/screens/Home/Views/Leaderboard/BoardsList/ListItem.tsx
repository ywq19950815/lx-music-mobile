import { useCallback, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import Text from '@/components/common/Text'
import Button, { type BtnType } from '@/components/common/Button'
import { type BoardItem } from '@/store/leaderboard/state'
import { Icon } from '@/components/common/Icon'
import { colors, radius } from '@/theme/tokens'

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
        styles.card,
        active ? styles.cardActive : styles.cardInactive,
      ]}
      key={item.id}
      onLongPress={setPosition}
      onPress={() => {
        onBoundChange(item)
      }}
    >
      <View style={[styles.badgeIconWrap, active ? styles.badgeIconWrapActive : styles.badgeIconWrapInactive]}>
        <Icon
          name="trophy"
          size={13}
          color={active ? '#FFFFFF' : '#8A92A0'}
        />
      </View>
      <View style={styles.textWrap}>
        <Text
          style={[styles.listName, active && styles.listNameActive]}
          size={13}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </View>
      {active && (
        <View style={styles.activeCheckWrap}>
          <Icon name="check" size={12} color="#31C27C" />
        </View>
      )}
    </Button>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '48.5%',
    height: 48,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    marginBottom: 8,
  },
  cardActive: {
    backgroundColor: 'rgba(49, 194, 124, 0.08)',
    borderWidth: 1.5,
    borderColor: '#31C27C',
  },
  cardInactive: {
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#ECEEF1',
  },
  badgeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  badgeIconWrapActive: {
    backgroundColor: '#31C27C',
  },
  badgeIconWrapInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: 4,
  },
  listName: {
    fontWeight: '500',
    color: '#2C3038',
  },
  listNameActive: {
    fontWeight: '700',
    color: '#15803D',
  },
  activeCheckWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(49, 194, 124, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
