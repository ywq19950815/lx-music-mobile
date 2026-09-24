import React from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
  type GestureResponderEvent,
} from 'react-native'
import { colors, radius } from '@/theme/tokens'

export interface NeoCardProps {
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  shadowColor?: string
  shadowOffset?: number
  pressable?: boolean
  disabled?: boolean
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}

/**
 * NeoCard (兼容层): 现代柔和高质感卡片组件。
 * 纯净白表面 + 极细边框 + 弥散软阴影。
 */
export const NeoCard: React.FC<NeoCardProps> = ({
  children,
  style,
  contentStyle,
  backgroundColor = colors.surface,
  borderColor = colors.hairline,
  borderWidth = StyleSheet.hairlineWidth,
  borderRadius = radius.lg,
  pressable = false,
  disabled = false,
  onPress,
  onLongPress,
}) => {
  const isInteractive = (pressable || !!onPress) && !disabled

  const cardContent = (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
          borderWidth,
          borderRadius,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  )

  if (isInteractive) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[styles.wrapper, style]}
      >
        {cardContent}
      </TouchableOpacity>
    )
  }

  return <View style={[styles.wrapper, style]}>{cardContent}</View>
}

const styles = StyleSheet.create({
  wrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    overflow: 'hidden',
  },
})

export default NeoCard
