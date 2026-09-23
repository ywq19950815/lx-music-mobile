import { useEffect, useMemo, useState } from 'react'
import { ScrollView, TouchableOpacity, StyleSheet, View } from 'react-native'
import { type SearchType } from '@/store/search/state'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { getSearchSetting } from '@/utils/data'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

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
                  color={neoColors.black}
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
  // 外层容器：给硬阴影留出溢出空间。
  // 关键坑：ScrollView 在 Web 端必然带 overflow-y:hidden，而激活态胶囊的
  // neoShadows.sm 是「右下 2.5px 实体硬阴影」，阴影会溢出按钮盒 2.5px。
  // 若 ScrollView 高度恰好等于按钮高度（height:'100%'），阴影的下沿就会被裁掉，
  // 视觉上就是「按钮底部被切了一块」。所以这里显式加 paddingBottom 让阴影有落脚处。
  container: {
    flexGrow: 0,
    flexShrink: 1,
    // 上下各留够阴影的高度（neoShadows.sm = 2.5px），避免 ScrollView 的
    // overflow-y:hidden 把实体硬阴影切掉。留 4px 比 2.5px 略宽，防止小数取整误差。
    paddingTop: 4,
    paddingBottom: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: neoBorders.radiusPill,
    marginRight: 8,
    borderWidth: 1.5,
  },
  tabActive: {
    backgroundColor: neoColors.yellow,
    borderColor: neoColors.black,
    ...neoShadows.sm,
  },
  tabInactive: {
    backgroundColor: neoColors.white,
    borderColor: neoColors.black,
  },
  tabText: {
    fontWeight: '700',
  },
  tabTextActive: {
    fontWeight: '900',
  },
})
