import { memo } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { useNavActiveId } from '@/store/common/hook'
import { setNavActiveId } from '@/core/common'
import type { InitState as CommonState } from '@/store/common/state'
import { neoColors } from '@/theme/neobrutalism'
import { indexMap } from './Main'

/**
 * 底部导航项的展示配置（不含顺序）。
 * ⚠️ 顺序必须与 PagerView 的页面顺序一致（见 Home/Vertical/Main.tsx 的 indexMap），
 * 否则「点第 N 个 Tab」和「左滑到第 N 页」会对不上。
 * 这里直接复用 indexMap 作为唯一顺序来源，避免两边各写一份再次错位。
 */
const TAB_META: Record<string, { icon: string; activeColor: string }> = {
  nav_search: { icon: 'search-2', activeColor: neoColors.pink },
  nav_songlist: { icon: 'album', activeColor: neoColors.yellow },
  nav_top: { icon: 'leaderboard', activeColor: neoColors.cyan },
  nav_love: { icon: 'love', activeColor: neoColors.purple },
  nav_setting: { icon: 'setting', activeColor: neoColors.green },
}

const TABS: Array<{ id: CommonState['navActiveId']; icon: string; activeColor: string }> =
  indexMap.map(id => ({ id, ...TAB_META[id] }))

/**
 * NeoTabBar: 新粗野主义 / 波普风底部导航栏（纯图标模式）。
 * - 鲜明 2.5px 纯黑顶部边框
 * - 纯图标（Icon-only）设计，去除多余文字干扰，视觉纯粹利落
 * - 激活态：波普高饱和实体印章（亮黄/荧光青/电光粉/薰衣草紫/鲜绿 + 2px黑边 + 零模糊硬阴影）
 * - 默认态：极简纯黑线性大图标
 */
export default memo(() => {
  const activeId = useNavActiveId()

  return (
    <View style={styles.container}>
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
    height: 54,
    backgroundColor: neoColors.white,
    // 不再画实体顶边：上方播放条已有 2.5px 黑边 + 硬阴影，
    // 两条黑边紧贴会显得拥挤、层级也分不清。
    // 改用极浅的分割线 + 顶部一点留白，让播放条像「浮在导航条之上」。
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: neoColors.gray200,
    paddingHorizontal: 12,
  },
  tab: {
    flex: 1,
    height: '100%',
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
