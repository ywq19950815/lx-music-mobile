import { useState } from 'react'
import { TouchableOpacity, StyleSheet, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'
import { neoColors } from '@/theme/neobrutalism'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

export default ({ icon, color, bg, onPress }: {
  icon: string
  color?: string
  bg?: string
  onPress: () => void
}) => {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <View style={styles.wrapper}>
      {/* 背后纯黑硬阴影底座 */}
      <View style={styles.shadowUnderlay} />
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={[
          styles.button,
          { backgroundColor: bg ?? neoColors.white },
          isPressed && styles.buttonPressed,
        ]}
        activeOpacity={1}
      >
        <Icon name={icon} color={color ?? neoColors.black} size={17} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: 36,
    height: 36,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadowUnderlay: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: neoColors.black,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: neoColors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    transform: [{ translateX: 1.5 }, { translateY: 1.5 }],
  },
})
