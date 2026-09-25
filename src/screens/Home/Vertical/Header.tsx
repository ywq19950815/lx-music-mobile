import { View, StyleSheet } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'
import SearchTypeSelector from '@/screens/Home/Views/Search/SearchTypeSelector'

const headerComponents: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {
  nav_search: <SearchTypeSelector />,
}

const TAB_TITLES: Partial<Record<CommonState['navActiveId'], string>> = {
  nav_search: '发现音乐',
  nav_songlist: '歌单广场',
  nav_top: '官方排行榜',
  nav_love: '我的音乐',
  nav_setting: '设置中心',
}

/**
 * 主页头部：QQ 音乐级轻奢极简 Chrome。
 * - 纯净白底，沉浸式延伸进系统状态栏
 * - 醒目品牌大标题 + 金色微装饰，视觉聚焦
 * - 极细高光分界底线
 */
const MainHeader = () => {
  const id = useNavActiveId()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()

  const displayTitle = TAB_TITLES[id] ?? t(id)

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
        {/* 品牌金色微质感重音标 */}
        <View style={styles.brandAccentDot} />
        <Text style={styles.title}>
          {displayTitle}
        </Text>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEEF1',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandAccentDot: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#F5A623',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.3,
  },
  right: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'visible',
  },
})

export default Header
