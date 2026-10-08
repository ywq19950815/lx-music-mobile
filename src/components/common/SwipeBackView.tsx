import React, { memo, useRef, useCallback } from 'react'
import {
  View,
  Animated,
  PanResponder,
  StyleSheet,
  Easing,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useWindowSize } from '@/utils/hooks'

export interface SwipeBackViewProps {
  children: React.ReactNode
  onBack: () => void
  disabled?: boolean
  /** 触发侧滑的左边缘有效宽度，默认 70dp */
  edgeWidth?: number
  /** 是否允许整个屏幕宽度内右滑返回（适用于无横向滚动的普通详情页），默认 false */
  fullWidth?: boolean
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
}

/**
 * 移动端全平台丝滑侧滑返回容器组件（SwipeBackView）
 * - 捕获左侧边缘向右的手势滑动（Swipe to Back）
 * - 60/120Hz 原生驱动跟手平移动效（useNativeDriver）
 * - 智能防误触：纵向滚动或非边缘触摸绝不抢占手势
 * - 超过滑出阈值或快速甩手时自动平滑滑出并触发 onBack() 回调
 */
export const SwipeBackView = memo(({
  children,
  onBack,
  disabled = false,
  edgeWidth = 70,
  fullWidth = false,
  style,
  contentStyle,
}: SwipeBackViewProps) => {
  const { width: winWidth } = useWindowSize()
  const translateX = useRef(new Animated.Value(0)).current
  const isSwiping = useRef(false)
  const isPopped = useRef(false)

  const handleBack = useCallback(() => {
    if (isPopped.current) return
    isPopped.current = true
    onBack()
  }, [onBack])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_e, g) => {
        if (disabled || isPopped.current) return false
        if (g.numberActiveTouches !== 1) return false
        const activeEdge = fullWidth ? winWidth : edgeWidth
        // 触摸起始点必须在左边缘区域内
        if (g.x0 > activeEdge) return false
        // 必须是明确向右滑动：横向位移大于 8dp，且横向位移是纵向位移的 1.5 倍以上
        return g.dx > 8 && g.dx > Math.abs(g.dy) * 1.5
      },
      onMoveShouldSetPanResponder: (_e, g) => {
        if (disabled || isPopped.current) return false
        if (g.numberActiveTouches !== 1) return false
        const activeEdge = fullWidth ? winWidth : edgeWidth
        if (g.x0 > activeEdge) return false
        return g.dx > 8 && g.dx > Math.abs(g.dy) * 1.5
      },
      onPanResponderGrant: () => {
        isSwiping.current = true
      },
      onPanResponderMove: (_e, g) => {
        if (!isSwiping.current || isPopped.current) return
        // 仅允许向右平移，向左限制在 0
        const currentX = Math.max(0, g.dx)
        translateX.setValue(currentX)
      },
      onPanResponderRelease: (_e, g) => {
        if (!isSwiping.current || isPopped.current) return
        isSwiping.current = false

        // 阈值：向右滑动超过屏幕宽度的 22% 或者向右甩动瞬时速度 > 0.4
        const threshold = winWidth * 0.22
        if (g.dx > threshold || g.vx > 0.4) {
          Animated.timing(translateX, {
            toValue: winWidth,
            duration: 180,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            handleBack()
          })
        } else {
          // 未达阈值，弹性回弹
          Animated.spring(translateX, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start()
        }
      },
      onPanResponderTerminate: () => {
        if (!isSwiping.current || isPopped.current) return
        isSwiping.current = false
        Animated.spring(translateX, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start()
      },
    })
  ).current

  const backdropOpacity = translateX.interpolate({
    inputRange: [0, winWidth],
    outputRange: [0.2, 0],
    extrapolate: 'clamp',
  })

  return (
    <View style={[styles.root, style]} {...panResponder.panHandlers}>
      {/* 侧滑底色与遮罩 */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
      />
      {/* 内容主体平移 */}
      <Animated.View
        style={[
          styles.content,
          contentStyle,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  )
})

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    width: '100%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
})

export default SwipeBackView
