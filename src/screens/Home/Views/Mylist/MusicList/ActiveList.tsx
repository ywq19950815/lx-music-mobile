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
import { colors } from '@/theme/tokens'

export interface ActiveListProps {
  onShowSearchBar: () => void
  onScrollToTop: () => void
  onBackToDashboard?: () => void
}
export interface ActiveListType {
  setVisibleBar: (visible: boolean) => void
}

/**
 * 歌单列表切换与搜索条：现代精炼胶囊设计。
 */
export default forwardRef<ActiveListType, ActiveListProps>(({ onShowSearchBar, onScrollToTop, onBackToDashboard }, ref) => {
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
      {onBackToDashboard ? (
        <TouchableOpacity
          onPress={onBackToDashboard}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Icon name="chevron-left" size={15} color={colors.ink} />
          <Text style={styles.backBtnText}>主页</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        onPress={showList}
        onLongPress={onScrollToTop}
        style={styles.pillBtn}
        activeOpacity={0.7}
      >
        <View style={styles.pillTag}>
          <Icon name="chevron-right" size={13} color={colors.inkSecondary} />
          {fetching ? <Loading color={colors.ink} style={styles.loading} /> : null}
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
        <Icon color={colors.inkSecondary} name="search-2" size={16} />
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEEF1',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  pillBtn: {
    flex: 1,
    marginRight: 10,
  },
  pillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    gap: 5,
  },
  loading: {
    marginRight: 4,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  searchBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
