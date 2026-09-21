import { memo } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useNavActiveId } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { setNavActiveId } from '@/core/common'
import { createStyle } from '@/utils/tools'
import type { InitState as CommonState } from '@/store/common/state'

const TABS: Array<{ id: CommonState['navActiveId'], icon: string }> = [
  { id: 'nav_songlist', icon: 'album' },
  { id: 'nav_top', icon: 'leaderboard' },
  { id: 'nav_search', icon: 'search-2' },
  { id: 'nav_love', icon: 'love' },
  { id: 'nav_setting', icon: 'setting' },
]

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const activeId = useNavActiveId()

  return (
    <View style={{
      ...styles.container,
      backgroundColor: theme['c-content-background'],
      borderTopColor: theme['c-border-background'] ?? 'rgba(128, 128, 148, 0.16)',
    }}>
      {
        TABS.map(({ id, icon }) => {
          const active = activeId == id
          return (
            <TouchableOpacity
              key={id}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={() => { setNavActiveId(id) }}
            >
              <View style={[styles.iconWrap, active ? { backgroundColor: theme['c-primary-background-hover'] ?? 'rgba(128, 128, 160, 0.14)' } : null]}>
                <Icon name={icon} size={20} color={active ? theme['c-primary-font-active'] : theme['c-font-label']} />
              </View>
              <Text
                style={{ ...styles.label, color: active ? theme['c-primary-font-active'] : theme['c-font-label'] }}
                size={11}
              >{t(id)}</Text>
            </TouchableOpacity>
          )
        })
      }
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 54,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 5,
  },
  iconWrap: {
    width: 30,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: 2,
    fontWeight: '500',
  },
})
