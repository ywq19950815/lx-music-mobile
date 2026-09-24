import { useEffect, useMemo, useState } from 'react'
import { ScrollView, TouchableOpacity, StyleSheet, View } from 'react-native'
import { type SearchType } from '@/store/search/state'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { getSearchSetting } from '@/utils/data'
import { colors } from '@/theme/tokens'

const SEARCH_TYPE_LIST = [
  'music',
  'songlist',
] as const

export default () => {
  const t = useI18n()
  const [type, setType] = useState<SearchType>('music')

  useEffect(() => {
    void getSearchSetting().then(info => {
      setType(info.type)
    })
  }, [])

  const list = useMemo(() => {
    return SEARCH_TYPE_LIST.map(type => ({ label: t(`search_type_${type}`), id: type }))
  }, [t])

  const handleTypeChange = (type: SearchType) => {
    setType(type)
    global.app_event.searchTypeChanged(type)
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps={'always'} horizontal={true}>
      <View style={styles.tabsRow}>
        {
          list.map(t => {
            const active = type === t.id
            return (
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  active ? styles.tabActive : styles.tabInactive,
                ]}
                activeOpacity={0.7}
                onPress={() => { handleTypeChange(t.id) }}
                key={t.id}
              >
                <Text
                  style={[styles.tabText, active && styles.tabTextActive]}
                  size={12}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            )
          })
        }
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    flexShrink: 1,
    paddingTop: 2,
    paddingBottom: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderColor: '#F5A623',
  },
  tabInactive: {
    backgroundColor: '#F3F4F6',
    borderColor: 'transparent',
  },
  tabText: {
    fontWeight: '500',
    color: '#5A616B',
  },
  tabTextActive: {
    fontWeight: '700',
    color: '#B36B00',
  },
})
