import { memo, useCallback, useState } from 'react'
import { View, TouchableOpacity, ScrollView } from 'react-native'

import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { SETTING_SCREENS, type SettingScreenIds } from '../Main'
import { useI18n } from '@/lang'
import { colors, radius } from '@/theme/tokens'

const ListItem = memo(({ id, activeId, onPress }: {
  onPress: (item: SettingScreenIds) => void
  activeId: string
  id: SettingScreenIds
}) => {
  const t = useI18n()
  const active = activeId == id

  const handlePress = () => {
    onPress(id)
  }

  return (
    <TouchableOpacity
      style={[
        styles.listItem,
        active ? styles.listItemActive : styles.listItemInactive,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.listText,
          active ? styles.listTextActive : styles.listTextInactive,
        ]}
      >
        {t(`setting_${id}`)}
      </Text>
    </TouchableOpacity>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.id === nextProps.id &&
    prevProps.activeId != nextProps.id &&
    nextProps.activeId != nextProps.id
  )
})

export default ({ onChangeId }: {
  onChangeId: (id: SettingScreenIds) => void
}) => {
  const [activeId, setActiveId] = useState(global.lx.settingActiveId)

  const handleChangeId = useCallback((id: SettingScreenIds) => {
    onChangeId(id)
    setActiveId(id)
    global.lx.settingActiveId = id
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ScrollView
      horizontal
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps={'always'}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      {SETTING_SCREENS.map(id => (
        <ListItem key={id} id={id} activeId={activeId} onPress={handleChangeId} />
      ))}
    </ScrollView>
  )
}

const styles = createStyle({
  container: {
    height: 48,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF2',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  listItem: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemActive: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
  },
  listItemInactive: {
    backgroundColor: 'transparent',
  },
  listText: {
    fontSize: 13,
  },
  listTextActive: {
    fontWeight: '700',
    color: colors.brand,
  },
  listTextInactive: {
    fontWeight: '500',
    color: colors.inkSecondary,
  },
})
