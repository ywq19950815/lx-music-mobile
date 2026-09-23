import { memo } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { useNavActiveId, useNavigationBarHeight } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import type { InitState as CommonState } from '@/store/common/state'
import { neoColors, neoBorders } from '@/theme/neobrutalism'
import { indexMap } from './Main'

/**
 * 底部导航项的展示配置（不含顺序）。
 * ⚠️ 顺序必须与 PagerView 的页面顺序一致（见 Home/Vertical/Main.tsx 的 indexMap），
 * 否则「点第 N 个 Tab」和「左滑到第 N 页」会对不上。
 * 这里直接复用 indexMap 作为唯一顺序来源，避免两边各写一份再次错位。
 *
 * 底色改成签名亮黄后，nav_songlist 原本的亮黄印章会与底栏糊成一片，
 * 因此它的激活色换成纯白（黑边仍在，依然跳得出来）。
 */
const TAB_META: Record<string, { icon: string; activeColor: string }> = {
  nav_search: { icon: 'search-2', activeColor: neoColors.pink },
  nav_songlist: { icon: 'album', activeColor: neoColors.white },
  nav_top: { icon: 'leaderboard', activeColor: neoColors.cyan },
  nav_love: { icon: 'love', activeColor: neoColors.purple },
  nav_setting: { icon: 'setting', activeColor: neoColors.green },
}

const TABS: Array<{ id: CommonState['navActiveId']; icon: string; activeColor: string }> =
  indexMap.map(id => ({ id, ...TAB_META[id] }))

const TAB_BAR_HEIGHT = 54

/**
 * NeoTabBar: 新粗野主义 / 波普风底部导航栏（纯图标模式）。
 * - 签名亮黄底色：向下延伸进手机底部导航栏/手势条「小白条」区域，实现真正的底部沉浸
 *   （窗口已 edge-to-edge，容器用 paddingBottom = 底部系统栏高度把图标顶上来）
 * - 鲜明 2.5px 纯黑顶部边框
 * - 纯图标（Icon-only）设计，去除多余文字干扰，视觉纯粹利落
 * - 激活态：波普高饱和实体印章（亮黄/荧光青/电光粉/薰衣草紫/鲜绿 + 2px黑边 + 零模糊硬阴影）
 * - 默认态：极简纯黑线性大图标
 */
export default memo(() => {
  const activeId = useNavActiveId()
  // 沉浸式下底栏会铺到手势条下面，必须让出这一段安全间距，
  // 否则图标会被系统手势条压住
  const navigationBarHeight = useNavigationBarHeight()

  return (
    <View style={[styles.container, { height: TAB_BAR_HEIGHT + navigationBarHeight, paddingBottom: navigationBarHeight }]}>
      {TABS.map(({ id, icon, activeColor }) => {
        const active = activeId === id
        return (
          <TouchableOpacity
            key={id}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => {
              setNavActiveId(id)
            }}
          >
            {active ? (
              // 激活态：波普实体印章按键（黑边 + 高饱和底色 + 零模糊纯黑实体硬投影）
              <View style={[styles.activeBadge, { backgroundColor: activeColor }]}>
                <Icon name={icon} size={22} color={neoColors.black} />
              </View>
            ) : (
              // 默认态：极简纯黑大图标
              <View style={styles.inactiveWrap}>
                <Icon name={icon} size={22} color={neoColors.gray700} />
              </View>
            )}
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
    // 高度 = 图标区 + 底部系统栏安全间距（由行内样式按实机 inset 计算）
    backgroundColor: neoColors.yellow,
    // 顶部纯黑粗边，与头部形成完整的波普外框
    borderTopWidth: neoBorders.regular,
    borderTopColor: neoColors.black,
    paddingHorizontal: 12,
  },
  tab: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 激活态：波普实体印章
  activeBadge: {
    width: 48,
    height: 34,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: neoColors.black,
    justifyContent: 'center',
    alignItems: 'center',
    // 零模糊纯黑实体硬阴影
    shadowColor: neoColors.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  // 默认态
  inactiveWrap: {
    width: 48,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
