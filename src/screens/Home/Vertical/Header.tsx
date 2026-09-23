import { View, StyleSheet } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'
import SearchTypeSelector from '@/screens/Home/Views/Search/SearchTypeSelector'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

const headerComponents: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {
  nav_search: <SearchTypeSelector />,
}

/**
 * NeoHeader: 新粗野主义主页头部。
 * - 签名亮黄底色：向上延伸进手机状态栏区域，实现真正的状态栏沉浸
 *   （窗口已 edge-to-edge，容器 paddingTop = 状态栏高度，同一底色铺满）
 * - 纯黑 2.5px 底部分割线
 * - 醒目的复古波普大标题（超粗黑体）
 * - 漫画风贴纸徽章
 */
const MainHeader = () => {
  const id = useNavActiveId()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()

  return (
    <View
      style={[
        styles.container,
        {
          height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
          paddingTop: statusBarHeight,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title} size={22}>
          {t(id)}
        </Text>
        {/* 波普漫画风小徽章 */}
        <View style={styles.popBadge}>
          <Text style={styles.popBadgeText}>ANDY</Text>
        </View>
      </View>

      <View style={styles.right}>
        {headerComponents[id] ?? null}
      </View>
    </View>
  )
}

const Header = () => {
  return (
    <>
      <StatusBar />
      <MainHeader />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingRight: 16,
    paddingLeft: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // 签名亮黄：向上铺进状态栏区域，状态栏图标本身透明，看起来就是「状态栏也是黄色的」
    backgroundColor: neoColors.yellow,
    borderBottomWidth: neoBorders.regular,
    borderBottomColor: neoColors.black,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '900',
    color: neoColors.black,
    letterSpacing: -0.5,
  },
  popBadge: {
    // 黄底上再用黄徽章会糊成一片，改成黑底黄字反而更跳
    backgroundColor: neoColors.black,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    transform: [{ rotate: '-3deg' }],
  },
  popBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: neoColors.yellow,
  },
  right: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    // 不要在这里加 overflow:hidden —— 切换器的实体硬阴影需要溢出可见
    overflow: 'visible',
  },
})

export default Header
