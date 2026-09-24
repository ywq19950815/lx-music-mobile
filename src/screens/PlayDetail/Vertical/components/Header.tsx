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
import Btn from './Btn'
import TimeoutExitBtn from './TimeoutExitBtn'

export const HEADER_HEIGHT = Math.max(scaleSizeH(_HEADER_HEIGHT), 52)

/**
 * 播放页头部：深色沉浸式。
 * - 透明背景直接融入深空底
 * - 白色歌名 + 半透明歌手幽灵胶囊 + 品牌金点
 * - 无描边、无贴纸装饰
 */
const Title = () => {
  const musicInfo = usePlayerMusicInfo()

  return (
    <View style={styles.titleContainer}>
      <Text numberOfLines={1} style={styles.titleText} size={15.5} color="rgba(255,255,255,0.95)">
        {musicInfo.name || '安迪音乐'}
      </Text>
      <View style={styles.singerBadge}>
        <View style={styles.singerDot} />
        <Text numberOfLines={1} style={styles.singerText} size={11} color="rgba(255,255,255,0.68)">
          {musicInfo.singer || 'Andy Music'}
        </Text>
      </View>
    </View>
  )
}

export default memo(() => {
  const popupRef = useRef<SettingPopupType>(null)
  const statusBarHeight = useStatusbarHeight()

  const back = () => {
    void pop(commonState.componentIds.playDetail!)
    globalThis.app_event?.emit('closePlayDetail')
    if (typeof window !== 'undefined' && (window as any).__lxTogglePlayDetail) {
      (window as any).__lxTogglePlayDetail(false)
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
        {/* 左侧：返回/收起按键 */}
        <View style={styles.sideLeft}>
          <Btn icon="chevron-left" onPress={back} />
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
  // 歌手幽灵胶囊
  singerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2.5,
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    maxWidth: '100%',
  },
  singerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F5A623',
    marginRight: 4,
  },
  singerText: {
    textAlign: 'center',
    fontWeight: '400',
  },
})
