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
  // 在 Android 下由于开启了沉浸式 (translucent=true)，顶栏必须留出真实状态栏物理避让空间
  // 现代打孔全面屏物理状态栏通常在 36~46dp 之间，多重保底彻底消除任何机型上的遮挡
  const statusBarHeight = Math.max(
    sbHeight,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 36) : 0,
    Platform.OS === 'android' ? 36 : 0,
  )

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
