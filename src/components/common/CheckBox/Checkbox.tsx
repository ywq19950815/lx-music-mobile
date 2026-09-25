import * as React from 'react'
import {
  Animated,
  type GestureResponderEvent,
  View,
  Pressable,
} from 'react-native'

import { createStyle } from '@/utils/tools'
import { colors, radius } from '@/theme/tokens'

export interface Props {
  /**
   * Status of checkbox.
   */
  status: 'checked' | 'unchecked' | 'indeterminate'
  /**
   * Whether checkbox is disabled.
   */
  disabled?: boolean
  /**
   * Function to execute on press.
   */
  onPress?: (e: GestureResponderEvent) => void

  size?: number

  /**
   * Custom color for checkbox.
   */
  tintColors?: {
    true: string
    false: string
  }
}

const BOX_SIZE = 22

/**
 * 现代流体质感复选框（QQ音乐/iOS 现代设计标准）：
 * - 柔和细边框 + 微圆角 (radius.sm)
 * - 选中态品牌暖金 (#F5A623) + 纯白精致对勾标记
 * - 柔和微投影 + 平滑弹性微动画
 */
const Checkbox = ({
  status,
  disabled,
  size = 1,
  onPress,
  tintColors,
  ...rest
}: Props) => {
  const checked = status === 'checked'
  const indeterminate = status === 'indeterminate'

  const { current: scaleAnim } = React.useRef<Animated.Value>(
    new Animated.Value(checked ? 1 : 0),
  )

  const isFirstRendering = React.useRef<boolean>(true)

  React.useEffect(() => {
    if (isFirstRendering.current) {
      isFirstRendering.current = false
      return
    }

    Animated.spring(scaleAnim, {
      toValue: checked ? 1 : 0,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start()
  }, [checked, scaleAnim])

  const boxDimension = Math.round(BOX_SIZE * size)

  return (
    <Pressable
      {...rest}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ disabled, checked }}
      accessibilityLiveRegion="polite"
      style={({ pressed }) => [
        styles.boxWrapper,
        {
          width: boxDimension,
          height: boxDimension,
          opacity: pressed ? 0.8 : 1,
        },
        checked ? styles.boxChecked : styles.boxUnchecked,
        disabled && styles.boxDisabled,
      ]}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: scaleAnim,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {indeterminate ? (
          <View
            style={[
              styles.minusBar,
              {
                width: Math.round(11 * size),
                height: Math.max(2, Math.round(2 * size)),
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.checkMark,
              {
                width: Math.round(10 * size),
                height: Math.round(5.5 * size),
              },
            ]}
          />
        )}
      </Animated.View>
    </Pressable>
  )
}

Checkbox.displayName = 'Checkbox'

const styles = createStyle({
  boxWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1.5,
    marginRight: 10,
    marginLeft: 2,
  },
  boxUnchecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  boxChecked: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  boxDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  // 纯白精致对勾：左下边框 + -45° 旋转 = ✓
  checkMark: {
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    borderStyle: 'solid',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
  // indeterminate（半选）横杠
  minusBar: {
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
})

export default Checkbox
