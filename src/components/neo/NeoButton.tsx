import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
  type GestureResponderEvent,
} from 'react-native'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

export type NeoButtonVariant = 'primary' | 'secondary' | 'cyan' | 'green' | 'purple' | 'white' | 'dark'
export type NeoButtonSize = 'sm' | 'md' | 'lg'

export interface NeoButtonProps {
  title?: string
  icon?: React.ReactNode
  variant?: NeoButtonVariant
  size?: NeoButtonSize
  pill?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  onPress?: (event: GestureResponderEvent) => void
  children?: React.ReactNode
}

const variantColors: Record<NeoButtonVariant, { bg: string; text: string; border: string }> = {
  primary: { bg: neoColors.yellow, text: neoColors.black, border: neoColors.black },
  secondary: { bg: neoColors.pink, text: neoColors.black, border: neoColors.black },
  cyan: { bg: neoColors.cyan, text: neoColors.black, border: neoColors.black },
  green: { bg: neoColors.green, text: neoColors.black, border: neoColors.black },
  purple: { bg: neoColors.purple, text: neoColors.black, border: neoColors.black },
  white: { bg: neoColors.white, text: neoColors.black, border: neoColors.black },
  dark: { bg: neoColors.black, text: neoColors.yellow, border: neoColors.black },
}

const sizeStyles: Record<NeoButtonSize, { paddingV: number; paddingH: number; fontSize: number; shadow: number }> = {
  sm: { paddingV: 6, paddingH: 12, fontSize: 12, shadow: 2.5 },
  md: { paddingV: 10, paddingH: 16, fontSize: 14, shadow: 3.5 },
  lg: { paddingV: 14, paddingH: 22, fontSize: 16, shadow: 5 },
}

/**
 * NeoButton: 经典新粗野主义实体按钮。
 * 纯黑硬轮廓 + 纯黑实体投影 + 物理位移下沉，充满玩具打击感。
 */
export const NeoButton: React.FC<NeoButtonProps> = ({
  title,
  icon,
  variant = 'primary',
  size = 'md',
  pill = false,
  disabled = false,
  style,
  contentStyle,
  textStyle,
  onPress,
  children,
}) => {
  const [isPressed, setIsPressed] = useState(false)

  const colors = variantColors[variant]
  const config = sizeStyles[size]
  const radius = pill ? neoBorders.radiusPill : neoBorders.radiusMd
  const shadow = config.shadow

  const translateDelta = isPressed ? shadow - 1 : 0

  return (
    <View style={[styles.wrapper, { paddingRight: shadow, paddingBottom: shadow }, style]}>
      {/* 背后实体投影 */}
      <View
        style={[
          styles.shadow,
          {
            backgroundColor: neoColors.black,
            borderRadius: radius,
            top: shadow,
            left: shadow,
          },
        ]}
      />

      {/* 按钮顶层 */}
      <TouchableOpacity
        activeOpacity={1}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
      >
        <View
          style={[
            styles.button,
            {
              backgroundColor: disabled ? neoColors.gray200 : colors.bg,
              borderColor: colors.border,
              borderWidth: neoBorders.regular,
              borderRadius: radius,
              paddingVertical: config.paddingV,
              paddingHorizontal: config.paddingH,
              transform: [
                { translateX: translateDelta },
                { translateY: translateDelta },
              ],
            },
            contentStyle,
          ]}
        >
          {icon && <View style={title || children ? styles.iconMargin : undefined}>{icon}</View>}
          {title ? (
            <Text
              style={[
                styles.text,
                {
                  fontSize: config.fontSize,
                  color: disabled ? neoColors.gray700 : colors.text,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : null}
          {children}
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  shadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  button: {
    position: 'relative',
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: 6,
  },
  text: {
    fontWeight: '900',
    letterSpacing: -0.2,
  },
})

export default NeoButton
