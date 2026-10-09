import { View, StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native'
import { useStatusbarHeight } from '@/store/common/hook'
import StatusBar from '@/components/common/StatusBar'
import { colors } from '@/theme/tokens'

/**
 * 主页状态栏占位（沉浸式页头体系）。
 * 各 Tab 页（发现 / 歌单 / 排行榜 / 我的）自带个性化页头，
 * 这里渲染系统状态栏并保证在 Android 透明状态栏 (translucent) 下保留安全区，避免遮挡顶栏。
 */
const Header = () => {
  const sbHeight = useStatusbarHeight()
  // 在 Android 下由于 translucent={true}，若 SizeView 计算出的 sbHeight 为 0，必须保底使用原生物理状态栏高度 (RNStatusBar.currentHeight ?? 24)
  const statusBarHeight = sbHeight > 0
    ? sbHeight
    : (Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0)

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
