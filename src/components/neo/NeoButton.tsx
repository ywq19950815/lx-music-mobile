import React from 'react'
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
import { colors, radius } from '@/theme/tokens'

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

const variantStyles: Record<NeoButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.brand, text: '#FFFFFF' },
  secondary: { bg: 'rgba(245, 166, 35, 0.12)', text: '#B36B00' },
  cyan: { bg: 'rgba(0, 180, 216, 0.12)', text: '#0077B6' },
  green: { bg: 'rgba(52, 199, 89, 0.12)', text: '#15803D' },
  purple: { bg: 'rgba(123, 97, 255, 0.12)', text: '#5E35B1' },
  white: { bg: '#F3F4F6', text: colors.inkSecondary },
  dark: { bg: colors.ink, text: '#FFFFFF' },
}

const sizeStyles: Record<NeoButtonSize, { paddingV: number; paddingH: number; fontSize: number }> = {
  sm: { paddingV: 6, paddingH: 12, fontSize: 12 },
  md: { paddingV: 9, paddingH: 16, fontSize: 13.5 },
  lg: { paddingV: 12, paddingH: 22, fontSize: 15 },
}

/**
 * NeoButton (兼容层): 现代圆角轻量化胶囊按钮。
 */
export const NeoButton: React.FC<NeoButtonProps> = ({
  title,
  icon,
  variant = 'primary',
  size = 'md',
  pill = true,
  disabled = false,
  style,
  contentStyle,
  textStyle,
  onPress,
  children,
}) => {
  const vStyle = variantStyles[variant]
  const config = sizeStyles[size]
  const btnRadius = pill ? radius.pill : radius.md

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? '#E5E7EB' : vStyle.bg,
          borderRadius: btnRadius,
          paddingVertical: config.paddingV,
          paddingHorizontal: config.paddingH,
        },
        variant === 'primary' && !disabled ? styles.primaryShadow : null,
        style,
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
              color: disabled ? colors.inkTertiary : vStyle.text,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      ) : null}
      {children}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  primaryShadow: {
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  iconMargin: {
    marginRight: 6,
  },
  text: {
    fontWeight: '600',
  },
})

export default NeoButton
