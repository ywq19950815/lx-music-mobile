import { memo } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useNavActiveId, useNavigationBarHeight } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import type { InitState as CommonState } from '@/store/common/state'
import { indexMap } from './Main'

/**
 * 底部导航项配置（QQ 音乐级精致图标 + 标贴体系）
 */
const TAB_META: Record<string, { icon: string; label: string }> = {
  nav_search: { icon: 'search-2', label: '发现' },
  nav_songlist: { icon: 'album', label: '歌单' },
  nav_top: { icon: 'leaderboard', label: '排行榜' },
  nav_love: { icon: 'love', label: '我的' },
  nav_setting: { icon: 'setting', label: '设置' },
}

const TABS: Array<{ id: CommonState['navActiveId']; icon: string; label: string }> =
  indexMap.map(id => ({ id, ...TAB_META[id] }))

const TAB_BAR_HEIGHT = 52

/**
 * 底部导航栏：QQ 音乐级双层轻盈架构（图标 + 标签）。
 * - 纯净白底 + 顶部极细微阴影与 hairline 分隔
 * - 激活态：品牌金高饱和图标 + 加粗小字
 * - 默认态：雅灰线性图标 + 柔和次级灰字
 */
export default memo(() => {
  const activeId = useNavActiveId()
  const navigationBarHeight = useNavigationBarHeight()

  return (
    <View style={[styles.container, { height: TAB_BAR_HEIGHT + navigationBarHeight, paddingBottom: navigationBarHeight }]}>
      {TABS.map(({ id, icon, label }) => {
        const active = activeId === id
        return (
          <TouchableOpacity
            key={id}
            style={styles.tab}
            activeOpacity={0.65}
            onPress={() => {
              setNavActiveId(id)
            }}
          >
            <View style={styles.iconBox}>
              <Icon
                name={icon}
                size={20}
                color={active ? '#F5A623' : '#8A919E'}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                active ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECEEF1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 8,
  },
  tab: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  iconBox: {
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#F5A623',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#8A919E',
    fontWeight: '500',
  },
})
