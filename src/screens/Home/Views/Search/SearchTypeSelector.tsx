import { useEffect, useMemo, useState } from 'react'
import { TouchableOpacity, StyleSheet, View } from 'react-native'
import { type SearchType } from '@/store/search/state'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { getSearchSetting } from '@/utils/data'

const SEARCH_TYPE_LIST = [
  'music',
  'songlist',
] as const

/**
 * 搜索分类切换胶囊（QQ 音乐一体化分段控制器 Segmented Control）
 */
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

  const handleTypeChange = (newType: SearchType) => {
    if (newType === type) return
    setType(newType)
    global.app_event.searchTypeChanged(newType)
  }

  return (
    <View style={styles.segmentWrapper}>
      {list.map(item => {
        const active = type === item.id
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}
            activeOpacity={0.7}
            onPress={() => handleTypeChange(item.id)}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  segmentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#6B7280',
  },
  segmentTextActive: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#F5A623',
  },
})
