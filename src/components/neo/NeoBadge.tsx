import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

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
  yellow: { bg: neoColors.yellow, text: neoColors.black },
  pink: { bg: neoColors.pink, text: neoColors.black },
  cyan: { bg: neoColors.cyan, text: neoColors.black },
  green: { bg: neoColors.green, text: neoColors.black },
  purple: { bg: neoColors.purple, text: neoColors.black },
  white: { bg: neoColors.white, text: neoColors.black },
  dark: { bg: neoColors.black, text: neoColors.yellow },
}

/**
 * NeoBadge: 波普风贴纸胶囊 / 徽章。
 * 黑边描边 + 微倾斜 + 高饱和色块。
 */
export const NeoBadge: React.FC<NeoBadgeProps> = ({
  label,
  color = 'yellow',
  rotate = 0,
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
          transform: rotate ? [{ rotate: `${rotate}deg` }] : undefined,
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
    borderWidth: 1.5,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusPill,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '900',
    letterSpacing: -0.2,
  },
})

export default NeoBadge
