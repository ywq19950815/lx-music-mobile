import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import { colors, radius } from '@/theme/tokens'

export type NeoBadgeColor = 'yellow' | 'pink' | 'cyan' | 'green' | 'purple' | 'white' | 'dark'

export interface NeoBadgeProps {
  label: string
  color?: NeoBadgeColor
  rotate?: number
  size?: 'sm' | 'md'
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

const colorMap: Record<NeoBadgeColor, { bg: string; text: string }> = {
  yellow: { bg: 'rgba(245, 166, 35, 0.12)', text: '#B36B00' },
  pink: { bg: '#FEE2E2', text: '#DC2626' },
  cyan: { bg: 'rgba(0, 180, 216, 0.12)', text: '#0077B6' },
  green: { bg: 'rgba(52, 199, 89, 0.12)', text: '#15803D' },
  purple: { bg: 'rgba(123, 97, 255, 0.12)', text: '#5E35B1' },
  white: { bg: '#F3F4F6', text: colors.inkSecondary },
  dark: { bg: colors.ink, text: '#FFFFFF' },
}

/**
 * NeoBadge (兼容层): 现代圆角微透胶囊徽章。
 */
export const NeoBadge: React.FC<NeoBadgeProps> = ({
  label,
  color = 'yellow',
  size = 'sm',
  style,
  textStyle,
}) => {
  const c = colorMap[color]
  const isSm = size === 'sm'

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: c.bg,
          paddingHorizontal: isSm ? 6 : 10,
          paddingVertical: isSm ? 2 : 4,
          borderRadius: radius.pill,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: c.text,
            fontSize: isSm ? 10 : 12,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
})

export default NeoBadge
