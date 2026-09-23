import React, { useState } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
  type GestureResponderEvent,
} from 'react-native'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

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
 * NeoCard: 具有硬边物理偏移阴影（Hard Offset Shadow）的新粗野主义卡片。
 * 原生与 Web 100% 像素级一致，按压时产生物理位移下沉反馈。
 */
export const NeoCard: React.FC<NeoCardProps> = ({
  children,
  style,
  contentStyle,
  backgroundColor = neoColors.white,
  borderColor = neoBorders.color,
  borderWidth = neoBorders.regular,
  borderRadius = neoBorders.radiusMd,
  shadowColor = neoColors.black,
  shadowOffset = 4,
  pressable = false,
  disabled = false,
  onPress,
  onLongPress,
}) => {
  const [isPressed, setIsPressed] = useState(false)

  const isInteractive = (pressable || !!onPress) && !disabled
  const activeOffset = isPressed ? 1.5 : shadowOffset

  // 前景卡片的位移量：按下时向右下平移，呈现压扁阴影的打击手感
  const translateDelta = isPressed ? shadowOffset - activeOffset : 0

  const cardContent = (
    <View
      style={[
        styles.front,
        {
          backgroundColor,
          borderColor,
          borderWidth,
          borderRadius,
          transform: [
            { translateX: translateDelta },
            { translateY: translateDelta },
          ],
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  )

  return (
    <View style={[styles.wrapper, { paddingRight: shadowOffset, paddingBottom: shadowOffset }, style]}>
      {/* 背后实体纯黑硬阴影层 */}
      {shadowOffset > 0 && (
        <View
          style={[
            styles.shadowUnderlay,
            {
              backgroundColor: shadowColor,
              borderRadius,
              top: shadowOffset,
              left: shadowOffset,
            },
          ]}
        />
      )}

      {/* 前景卡片 */}
      {isInteractive ? (
        <TouchableOpacity
          activeOpacity={1}
          disabled={disabled}
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
        >
          {cardContent}
        </TouchableOpacity>
      ) : (
        cardContent
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  shadowUnderlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  front: {
    position: 'relative',
    zIndex: 1,
    overflow: 'hidden',
  },
})

export default NeoCard
