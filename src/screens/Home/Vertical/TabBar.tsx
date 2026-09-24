import { memo } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useNavActiveId, useNavigationBarHeight } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import type { InitState as CommonState } from '@/store/common/state'
import { indexMap } from './Main'

/**
 * 底部导航项配置（不含顺序）。
 * ⚠️ 顺序必须与 PagerView 的页面顺序一致（见 Home/Vertical/Main.tsx 的 indexMap）。
 */
const TAB_META: Record<string, { icon: string }> = {
  nav_search: { icon: 'search-2' },
  nav_songlist: { icon: 'album' },
  nav_top: { icon: 'leaderboard' },
  nav_love: { icon: 'love' },
  nav_setting: { icon: 'setting' },
}

const TABS: Array<{ id: CommonState['navActiveId']; icon: string }> =
  indexMap.map(id => ({ id, ...TAB_META[id] }))

const TAB_BAR_HEIGHT = 54

/**
 * 底部导航栏：QQ 音乐式浅色 chrome（纯图标模式）。
 * - 白底 + hairline 顶部分隔，向下延伸进手势条区域
 * - 激活态：品牌金图标 + 下方金圆点指示器
 * - 默认态：灰色线性图标
 */
export default memo(() => {
  const activeId = useNavActiveId()
  const navigationBarHeight = useNavigationBarHeight()

  return (
    <View style={[styles.container, { height: TAB_BAR_HEIGHT + navigationBarHeight, paddingBottom: navigationBarHeight }]}>
      {TABS.map(({ id, icon }) => {
        const active = activeId === id
        return (
          <TouchableOpacity
            key={id}
            style={styles.tab}
            activeOpacity={0.6}
            onPress={() => {
              setNavActiveId(id)
            }}
          >
            <View style={styles.iconWrap}>
              <Icon name={icon} size={22} color={active ? '#F5A623' : '#9AA1AB'} />
            </View>
            <View style={[styles.dot, active && styles.dotActive]} />
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
    paddingHorizontal: 12,
  },
  tab: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  iconWrap: {
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 激活指示点
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: '#F5A623',
  },
})
