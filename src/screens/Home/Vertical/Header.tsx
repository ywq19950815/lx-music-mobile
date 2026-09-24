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

/**
 * 主页头部：QQ 音乐式浅色 chrome。
 * - 纯白底，向上延伸进状态栏实现沉浸
 * - 深色大标题，常规字重，无贴纸装饰
 * - 底部 hairline 分隔
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
  title: {
    fontWeight: '700',
    color: '#1A1C20',
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
