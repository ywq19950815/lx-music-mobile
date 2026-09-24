import { useState, useRef, useCallback } from 'react'
import { TouchableOpacity, StyleSheet, View, Animated } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { motion } from '@/theme/tokens'

/**
 * 播放页圆形操作钮：幽灵样式（半透明白底白图标），深色沉浸专用。
 * 激活态（bg 传入品牌金）时用金底。按压 spring 缩放。
 */
export default ({ icon, color, bg, onPress }: {
  icon: string
  color?: string
  bg?: string
  onPress: () => void
}) => {
  const scale = useRef(new Animated.Value(1)).current
  const pressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.88,
      friction: motion.spring.friction,
      tension: motion.spring.tension,
      useNativeDriver: true,
    }).start()
  }, [scale])
  const pressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: motion.spring.friction,
      tension: motion.spring.tension,
      useNativeDriver: true,
    }).start()
  }, [scale])

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.button, { backgroundColor: bg ?? 'rgba(255,255,255,0.10)' }]}
        activeOpacity={1}
      >
        <Icon name={icon} color={color ?? 'rgba(255,255,255,0.88)'} size={17} />
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
})
