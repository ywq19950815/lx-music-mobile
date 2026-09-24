import { TouchableOpacity, StyleSheet, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { scaleSizeW } from '@/utils/pixelRatio'

export const BTN_WIDTH = scaleSizeW(36)
export const BTN_ICON_SIZE = 20

/**
 * 播放页更多操作钮：幽灵样式（半透明白底白图标），深色沉浸专用。
 */
export default ({ icon, color, onPress, onLongPress }: {
  icon: string
  color?: string
  onPress: () => void
  onLongPress?: () => void
}) => {
  return (
    <View style={styles.btnWrapper}>
      <TouchableOpacity
        style={styles.controlBtn}
        activeOpacity={0.6}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <Icon name={icon} color={color ?? 'rgba(255,255,255,0.75)'} size={BTN_ICON_SIZE} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  btnWrapper: {
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtn: {
    width: BTN_WIDTH,
    height: BTN_WIDTH,
    borderRadius: BTN_WIDTH / 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
