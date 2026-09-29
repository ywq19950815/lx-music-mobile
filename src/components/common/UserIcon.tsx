import React, { memo } from 'react'
import { View, StyleSheet } from 'react-native'

interface UserIconProps {
  color: string
  size: number
}

/**
 * 「我的」人像图标（自绘）。
 * IcoMoon 字体库无人像字形，原先误用单曲字形（小尺寸下形似"禁止"符，语义不清）。
 * 形态：头部圆环 + 肩部半环，Feather 风 outlined user，与其它 Tab 线性图标风格一致。
 */
const UserIcon = ({ color, size }: UserIconProps) => {
  const stroke = Math.max(1.5, size * 0.09)
  const headSize = size * 0.36
  const bodyWidth = size * 0.68
  const bodyHeight = bodyWidth / 2

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {/* 头部圆环 */}
      <View style={{
        position: 'absolute',
        top: size * 0.09,
        width: headSize,
        height: headSize,
        borderRadius: headSize / 2,
        borderWidth: stroke,
        borderColor: color,
      }} />
      {/* 肩部半环 */}
      <View style={{
        width: bodyWidth,
        height: bodyHeight,
        borderTopLeftRadius: bodyWidth / 2,
        borderTopRightRadius: bodyWidth / 2,
        borderWidth: stroke,
        borderBottomWidth: 0,
        borderColor: color,
      }} />
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
})

export default memo(UserIcon)
