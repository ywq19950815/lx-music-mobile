import { TouchableOpacity, StyleSheet, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { scaleSizeW } from '@/utils/pixelRatio'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

export const BTN_WIDTH = scaleSizeW(36)
export const BTN_ICON_SIZE = 20

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
        activeOpacity={0.7}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <Icon name={icon} color={color ?? neoColors.black} size={BTN_ICON_SIZE} />
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
    backgroundColor: neoColors.white,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    justifyContent: 'center',
    alignItems: 'center',
    ...neoShadows.sm,
  },
})
