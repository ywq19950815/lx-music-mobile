import { useRef, useCallback } from 'react'
import { TouchableOpacity, StyleSheet, View, Animated } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { motion, useAppColors, useIsDarkTheme } from '@/theme/tokens'

/**
 * 播放页圆形操作钮（2026-09-29 设计稿：浅色白卡描边 / 深色幽灵样式）。
 * 浅色：白底 + hairline 描边 + 墨色图标（设计稿 bg-card border-border）
 * 深色：半透明白底幽灵样式
 * 激活态（bg 传入品牌绿）时用绿底白图标。按压 spring 缩放。
 */
export default ({ icon, color, bg, onPress, iconStyle }: {
  icon: string
  color?: string
  bg?: string
  onPress: () => void
  iconStyle?: object
}) => {
  const c = useAppColors()
  const isDark = useIsDarkTheme()
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
        style={[
          styles.button,
          {
            backgroundColor: bg ?? (isDark ? 'rgba(255,255,255,0.10)' : '#FFFFFF'),
            borderColor: bg ? 'transparent' : (isDark ? 'rgba(255,255,255,0.08)' : c.hairline),
          },
        ]}
        activeOpacity={1}
      >
        <Icon name={icon} color={color ?? (isDark ? 'rgba(255,255,255,0.88)' : c.ink)} size={17} style={iconStyle} />
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
  },
})
