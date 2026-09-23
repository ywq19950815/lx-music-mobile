import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useActiveListId, useListFetching } from '@/store/list/hook'
import listState from '@/store/list/state'
import { getListPrevSelectId } from '@/utils/data'
import { setActiveList } from '@/core/list'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'
import Loading from '@/components/common/Loading'
import { useSettingValue } from '@/store/setting/hook'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

export interface ActiveListProps {
  onShowSearchBar: () => void
  onScrollToTop: () => void
}
export interface ActiveListType {
  setVisibleBar: (visible: boolean) => void
}

/**
 * NeoActiveList: 新粗野主义风格的当前歌单切换与搜索条。
 * - 纯黑 2px 底边
 * - 亮黄色波普胶囊指示器
 * - 粗黑大字号
 */
export default forwardRef<ActiveListType, ActiveListProps>(({ onShowSearchBar, onScrollToTop }, ref) => {
  const currentListId = useActiveListId()
  const fetching = useListFetching(currentListId)
  const langId = useSettingValue('common.langId')
  const currentListName = useMemo(() => {
    switch (currentListId) {
      case LIST_IDS.TEMP:
        return global.i18n.t('list_name_temp')
      case LIST_IDS.DEFAULT:
        return global.i18n.t('list_name_default')
      case LIST_IDS.LOVE:
        return global.i18n.t('list_name_love')
      default:
        return listState.allList.find(l => l.id === currentListId)?.name ?? ''
    }
  }, [currentListId, langId])
  const [visibleBar, setVisibleBar] = useState(true)

  useImperativeHandle(ref, () => ({
    setVisibleBar(visible) {
      setVisibleBar(visible)
    },
  }))

  const showList = () => {
    global.app_event.changeLoveListVisible(true)
  }

  useEffect(() => {
    void getListPrevSelectId().then((id) => {
      setActiveList(id)
    })
  }, [])

  // 隐藏时必须卸载，否则这层浮层会继续拦截点击（例如搜索按钮/胶囊点不动）
  if (!visibleBar) return null

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={showList}
        onLongPress={onScrollToTop}
        style={styles.pillBtn}
        activeOpacity={0.7}
      >
        <View style={styles.pillTag}>
          <Icon name="chevron-right" size={14} color={neoColors.black} />
          {fetching ? <Loading color={neoColors.black} style={styles.loading} /> : null}
          <Text style={styles.listTitle} numberOfLines={1}>
            {currentListName}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 搜索小按钮 */}
      <TouchableOpacity
        style={styles.searchBtn}
        onPress={onShowSearchBar}
        activeOpacity={0.6}
      >
        <Icon color={neoColors.black} name="search-2" size={16} />
      </TouchableOpacity>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: neoColors.white,
    borderBottomWidth: neoBorders.regular,
    borderBottomColor: neoColors.black,
  },
  pillBtn: {
    flex: 1,
    marginRight: 10,
  },
  pillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: neoBorders.radiusPill,
    backgroundColor: neoColors.yellow,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    gap: 4,
  },
  loading: {
    marginRight: 4,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: neoColors.black,
    letterSpacing: -0.2,
  },
  searchBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: neoColors.white,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
