import * as React from 'react'
import {
  Animated,
  type GestureResponderEvent,
  StyleSheet,
  View,
  Pressable,
} from 'react-native'

import { createStyle } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'

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

const ANIMATION_DURATION = 150
const BOX_SIZE = 22

/**
 * Neo-Brutalism 风格复选框：
 * - 纯黑 2px 粗实描边
 * - 零模糊 1.5px 实体物理硬阴影
 * - 选中态高饱和波普明黄 (#FFE600) + 纯黑加粗勾选标记
 * - 实体按压反馈与流畅弹性微动画
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
      friction: 6,
      tension: 100,
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
          transform: [{ translateY: pressed ? 1.5 : 0 }, { translateX: pressed ? 1.5 : 0 }],
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
        {/* 不用图标字体画对勾：selection.json 里根本没有 check-bold 字形，
            之前渲染出来是一个小圆点。改用纯 View 画的 CSS 对勾，两端渲染一致且锐利。 */}
        {indeterminate
          ? <View style={[styles.minusBar, { width: Math.round(11 * size), height: Math.max(2, Math.round(2.5 * size)) }]} />
          : <View style={[styles.checkMark, { width: Math.round(11 * size), height: Math.round(6 * size) }]} />}
      </Animated.View>
    </Pressable>
  )
}

Checkbox.displayName = 'Checkbox'

const styles = createStyle({
  boxWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
    marginRight: 10,
    marginLeft: 2,
  },
  boxUnchecked: {
    backgroundColor: '#FFFFFF',
  },
  boxChecked: {
    backgroundColor: '#FFE600', // 高饱和波普黄
  },
  boxDisabled: {
    backgroundColor: '#E8E8E8',
    borderColor: '#888888',
    shadowOpacity: 0,
    elevation: 0,
  },
  // 纯 View 对勾：左下边框 + -45° 旋转 = ✓
  checkMark: {
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: '#000000',
    borderStyle: 'solid',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
  // indeterminate（半选）态的横杠
  minusBar: {
    borderRadius: 2,
    backgroundColor: '#000000',
  },
})

export default Checkbox

