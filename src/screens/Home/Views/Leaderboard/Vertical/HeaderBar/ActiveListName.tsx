import { forwardRef, useImperativeHandle, useState } from 'react'
import { TouchableOpacity, StyleSheet, View } from 'react-native'

import Text from '@/components/common/Text'
import { colors, radius } from '@/theme/tokens'

export interface ActiveListNameProps {
  onShowBound: () => void
}
export interface ActiveListNameType {
  setBound: (id: string, name: string) => void
}

export default forwardRef<ActiveListNameType, ActiveListNameProps>(({ onShowBound }, ref) => {
  const [currentListName, setCurrentListName] = useState('热歌榜')

  useImperativeHandle(ref, () => ({
    setBound(id, name) {
      setCurrentListName(name || '热歌榜')
    },
  }), [])

  return (
    <TouchableOpacity
      testID="btn-leaderboard-change-board"
      activeOpacity={0.8}
      onPress={onShowBound}
      style={styles.badgeBtn}
    >
      <Text style={styles.trophy}>🏆</Text>
      <Text numberOfLines={1} style={styles.badgeText}>
        {currentListName}
      </Text>
      <View style={styles.chevronWrap}>
        <Text style={styles.chevron}>切换 ▾</Text>
      </View>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  badgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  trophy: {
    fontSize: 13,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    maxWidth: 130,
  },
  chevronWrap: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
  },
  chevron: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
})
