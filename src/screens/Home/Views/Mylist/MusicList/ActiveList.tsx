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
 * 歌单列表顶栏：对标 QQ 音乐风格，清爽优雅、层级清晰。
 */
export default forwardRef<ActiveListType, ActiveListProps>(({ onShowSearchBar, onScrollToTop, onBackToDashboard }, ref) => {
  const currentListId = useActiveListId()
  const fetching = useListFetching(currentListId)
  const langId = useSettingValue('common.langId')
  const currentListName = useMemo(() => {
    switch (currentListId) {
      case LIST_IDS.TEMP:
        return '最近播放'
      case LIST_IDS.DEFAULT:
        return '最近播放'
      case LIST_IDS.LOVE:
        return '我喜欢'
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

  // 隐藏时必须卸载，否则这层浮层会继续拦截点击
  if (!visibleBar) return null

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        {onBackToDashboard ? (
          <TouchableOpacity
            onPress={onBackToDashboard}
            style={styles.backBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="chevron-left" size={20} color="#1E293B" />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={showList}
          onLongPress={onScrollToTop}
          style={styles.titleArea}
          activeOpacity={0.7}
        >
          {fetching ? <Loading color={colors.brand} style={styles.loading} /> : null}
          <Text style={styles.listTitle} numberOfLines={1}>
            {currentListName}
          </Text>
          <View style={styles.switchIconBox}>
            <Icon name="menu-down" size={16} color="#94A3B8" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 搜索小按钮 */}
      <TouchableOpacity
        style={styles.searchBtn}
        onPress={onShowSearchBar}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon color="#475569" name="search-2" size={17} />
      </TouchableOpacity>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  loading: {
    marginRight: 6,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  switchIconBox: {
    marginLeft: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
