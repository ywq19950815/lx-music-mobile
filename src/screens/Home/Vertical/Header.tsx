import { View, StyleSheet } from 'react-native'
import { useStatusbarHeight } from '@/store/common/hook'
import StatusBar from '@/components/common/StatusBar'
import { colors } from '@/theme/tokens'

/**
 * 主页状态栏占位（2026-09-29 设计稿：沉浸式页头体系）。
 * 各 Tab 页（发现 / 歌单 / 排行榜 / 我的）自带个性化页头，
 * 这里仅渲染系统状态栏并以页面底色延伸，营造沉浸感。
 */
const Header = () => {
  const statusBarHeight = useStatusbarHeight()

  return (
    <>
      <StatusBar />
      <View style={[styles.statusBarSpacer, { height: statusBarHeight }]} />
    </>
  )
}

const styles = StyleSheet.create({
  statusBarSpacer: {
    backgroundColor: colors.canvas,
  },
})

export default Header
