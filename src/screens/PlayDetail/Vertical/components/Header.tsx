import { memo, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import { useStatusbarHeight } from '@/store/common/hook'
import { useAppColors } from '@/theme/tokens'
import Btn from './Btn'
import TimeoutExitBtn from './TimeoutExitBtn'

export const HEADER_HEIGHT = Math.max(scaleSizeH(_HEADER_HEIGHT), 52)

/**
 * 播放页头部（2026-09-29 设计稿：浅色黑胶台 / 深色双主题）。
 * - 透明背景直接融入页面底色
 * - 居中歌名 + 歌手胶囊（浅色下为素雅灰底）
 * - 左侧下拉收起键（chevron-down 圆钮，设计稿样式）
 */
const Title = () => {
  const musicInfo = usePlayerMusicInfo()
  const c = useAppColors()

  return (
    <View style={styles.titleContainer}>
      <Text numberOfLines={1} style={[styles.titleText, { color: c.ink }]} size={15.5}>
        {musicInfo.name || '安迪音乐'}
      </Text>
      <View style={[styles.singerBadge, { backgroundColor: c.muted }]}>
        <View style={[styles.singerDot, { backgroundColor: c.brand }]} />
        <Text numberOfLines={1} style={{ color: c.inkSecondary }} size={11}>
          {musicInfo.singer || 'Andy Music'}
        </Text>
      </View>
    </View>
  )
}

export default memo(({ componentId }: { componentId?: string }) => {
  const popupRef = useRef<SettingPopupType>(null)
  const statusBarHeight = useStatusbarHeight()

  const back = () => {
    // 优先用屏幕自身的 componentId（与系统返回/下拉手势同一链路），
    // 避免 commonState 注册时序/过期问题导致 pop 静默失败
    const compId = componentId ?? commonState.componentIds.playDetail
    if (compId) void pop(compId)
    global.app_event?.closePlayDetail?.()
    if ((globalThis as any).__lxTogglePlayDetail) {
      (globalThis as any).__lxTogglePlayDetail(false)
    }
  }

  const showSetting = () => {
    popupRef.current?.show()
  }

  return (
    <View
      style={[
        styles.headerWrapper,
        { height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight },
      ]}
      nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}
    >
      <StatusBar />

      <View style={styles.container}>
        {/* 左侧：下拉收起按键（设计稿 chevron-down，用 chevron-left 旋转实现） */}
        <View style={styles.sideLeft}>
          <Btn icon="chevron-left" onPress={back} iconStyle={styles.backIconRotate} />
        </View>

        {/* 绝对几何居中：歌曲标题与歌手胶囊 */}
        <View style={styles.centerTitleWrapper} pointerEvents="box-none">
          <Title />
        </View>

        {/* 右侧：定时退出与音效设置 */}
        <View style={styles.sideRight}>
          <TimeoutExitBtn />
          <Btn icon="slider" onPress={showSetting} />
        </View>
      </View>

      <SettingPopup ref={popupRef} direction="vertical" />
    </View>
  )
})

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 10,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    position: 'relative',
  },
  sideLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  sideRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  centerTitleWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 92,
    zIndex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  titleText: {
    textAlign: 'center',
    fontWeight: '700',
  },
  // 歌手胶囊
  singerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2.5,
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: 999,
    maxWidth: '100%',
  },
  singerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  backIconRotate: {
    transform: [{ rotate: '-90deg' }],
  },
})
