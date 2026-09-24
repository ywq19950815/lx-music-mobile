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
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()

  const back = () => {
    void pop(commonState.componentIds.comment!)
  }

  return (
    <View style={{ height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight }}>
      <StatusBar />
      <View style={{ ...styles.container }}>
        <TouchableOpacity onPress={back} style={{ ...styles.button, width: HEADER_HEIGHT }}>
          <Icon name="chevron-left" size={18} color={colors.ink} />
        </TouchableOpacity>
        <Text numberOfLines={1} size={16} style={styles.title}>{t('comment_title', { name: musicInfo.name, singer: musicInfo.singer })}</Text>
        {/* <TouchableOpacity onPress={back} style={{ ...styles.button }}>
          <Icon name="available_updates" style={{ color: theme.normal }} size={24} />
        </TouchableOpacity> */}
      </View>
    </View>
  )
})


const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingRight: 40,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  button: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.ink,
    fontWeight: '600',
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})
