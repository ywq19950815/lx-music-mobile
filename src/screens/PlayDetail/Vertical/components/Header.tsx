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
import { neoColors } from '@/theme/neobrutalism'

export const HEADER_HEIGHT = Math.max(scaleSizeH(_HEADER_HEIGHT), 52)

/**
 * Title: Neo-Brutalism 实体波普居中黑胶铭牌
 * - 歌名 900 极粗黑体
 * - 歌手包裹在精致的波普圆角胶囊标签内（配粉色发光小圆点）
 */
const Title = () => {
  const musicInfo = usePlayerMusicInfo()

  return (
    <View style={styles.titleContainer}>
      <Text numberOfLines={1} style={styles.titleText} size={15.5} color={neoColors.black}>
        {musicInfo.name || '安迪音乐'}
      </Text>
      <View style={styles.singerBadge}>
        <View style={styles.singerDot} />
        <Text numberOfLines={1} style={styles.singerText} size={11} color={neoColors.black}>
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

      {/* 主操作栏内容 */}
      <View style={styles.container}>
        {/* 左侧：返回/收起按键 */}
        <View style={styles.sideLeft}>
          <Btn icon="chevron-left" onPress={back} />
        </View>

        {/* 绝对几何居中：歌曲标题与歌手徽章铭牌 */}
        <View style={styles.centerTitleWrapper} pointerEvents="box-none">
          <Title />
        </View>

        {/* 右侧：定时退出与音效设置按键组（保持间距，绝不重叠） */}
        <View style={styles.sideRight}>
          <TimeoutExitBtn />
          <Btn icon="slider" bg={neoColors.yellow} onPress={showSetting} />
        </View>
      </View>

      {/* 底部波普明黄点缀细条 */}
      <View style={styles.bottomAccentBar} />

      <SettingPopup ref={popupRef} direction="vertical" />
    </View>
  )
})

const styles = StyleSheet.create({
  headerWrapper: {
    // 与首页头部/底部菜单统一的签名亮黄，沉浸式下由它铺满状态栏区域
    backgroundColor: neoColors.yellow,
    borderBottomWidth: 2.5,
    borderBottomColor: neoColors.black,
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
  // 标题绝对水平居中容器
  centerTitleWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 92, // 避开左右两侧按钮
    zIndex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  titleText: {
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  // 歌手波普微胶囊铭牌
  singerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2.5,
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: 999,
    backgroundColor: '#F4F3ED',
    borderWidth: 1.2,
    borderColor: neoColors.black,
    maxWidth: '100%',
  },
  singerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: neoColors.pink,
    marginRight: 4,
    borderWidth: 0.5,
    borderColor: neoColors.black,
  },
  singerText: {
    textAlign: 'center',
    fontWeight: '700',
  },
  // 底部波普黑色分隔粗线（黄底上黄色点缀会糊掉，改用黑色强化外框）
  bottomAccentBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -2.5,
    height: 2.5,
    backgroundColor: neoColors.black,
  },
})
