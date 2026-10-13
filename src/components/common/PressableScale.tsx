import { useCallback, useRef, type ReactNode } from 'react'
import { Animated, TouchableOpacity, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { motion } from '@/theme/tokens'

export interface PressableScaleProps {
  onPress?: () => void
  onLongPress?: () => void
  onPressIn?: () => void
  onPressOut?: () => void
  disabled?: boolean
  /** 布局样式作用于外层容器（缩放与背景着色都基于它） */
  style?: StyleProp<ViewStyle>
  /** 按压缩放目标值，默认 motion.pressScale(0.96)；列表行建议传 0.98 更克制 */
  scaleTo?: number
  /** 按压时附加的背景着色（如 'rgba(49,194,124,0.06)'），不传则仅缩放 */
  pressBg?: string
  children: ReactNode
  hitSlop?: { top?: number, bottom?: number, left?: number, right?: number }
  testID?: string
  delayLongPress?: number
  /** 内容横向排布（列表行等单行布局必开，否则子元素会竖向堆叠） */
  row?: boolean
}

/**
 * 全局统一按压反馈（QQ 音乐式物理质感）：
 * - 弹簧缩放（motion.spring 回弹曲线，native driver）
 * - 可选背景着色（按压瞬间淡入，松开淡出）
 *
 * 替代全 App 散乱的 activeOpacity 0.6~0.92 取值，所有可点区域
 * 共用同一套按压语言；列表行用 scaleTo=0.98 + pressBg 更克制。
 */
export default function PressableScale({
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled = false,
  style,
  scaleTo = motion.pressScale,
  pressBg,
  children,
  hitSlop,
  testID,
  delayLongPress = 500,
  row = false,
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current
  const press = useRef(new Animated.Value(0)).current

  const animateTo = useCallback((pressed: boolean) => {
    Animated.spring(scale, {
      toValue: pressed ? scaleTo : 1,
      friction: motion.spring.friction,
      tension: motion.spring.tension,
      useNativeDriver: true,
    }).start()
    if (pressBg) {
      Animated.timing(press, {
        toValue: pressed ? 1 : 0,
        duration: motion.durationFast,
        useNativeDriver: false,
      }).start()
    }
  }, [scale, press, scaleTo, pressBg])

  const bgStyle = pressBg
    ? { backgroundColor: press.interpolate({ inputRange: [0, 1], outputRange: ['rgba(0, 0, 0, 0)', pressBg] }) }
    : null

  return (
    <Animated.View style={[style, bgStyle, { transform: [{ scale }] }]}>
      <TouchableOpacity
        testID={testID}
        activeOpacity={1}
        disabled={disabled}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => { animateTo(true); onPressIn?.() }}
        onPressOut={() => { animateTo(false); onPressOut?.() }}
        delayLongPress={delayLongPress}
        hitSlop={hitSlop}
        style={[styles.inner, row && styles.innerRow]}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
