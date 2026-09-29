import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { pop } from '@/navigation'
// import { AppColors } from '@/theme'
import StatusBar from '@/components/common/StatusBar'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'
import { scaleSizeH } from '@/utils/pixelRatio'
import commonState from '@/store/common/state'
import { useStatusbarHeight } from '@/store/common/hook'
import { colors } from '@/theme/tokens'
import { StyleSheet } from 'react-native'

const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

export default memo(({ musicInfo }: {
  musicInfo: LX.Music.MusicInfo
}) => {
  const statusBarHeight = useStatusbarHeight()

  const back = () => {
    void pop(commonState.componentIds.comment!)
  }

  return (
    <View style={[styles.root, { height: 56 + statusBarHeight, paddingTop: statusBarHeight }]}>
      <StatusBar />
      <View style={styles.container}>
        {/* 左侧圆形返回按钮 */}
        <TouchableOpacity onPress={back} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="chevron-left" size={18} color={colors.ink} />
        </TouchableOpacity>

        {/* 中间双行标题 */}
        <View style={styles.center}>
          <Text numberOfLines={1} style={styles.mainTitle}>歌曲评论</Text>
          <Text numberOfLines={1} style={styles.subTitle}>
            《{musicInfo.name}》{musicInfo.singer ? ` · ${musicInfo.singer}` : ''}
          </Text>
        </View>

        {/* 右侧占位保持对称 */}
        <View style={styles.rightPlaceholder} />
      </View>
    </View>
  )
})


const styles = StyleSheet.create({
  root: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  rightPlaceholder: {
    width: 36,
    height: 36,
  },
})
