// Slider web mock：静态轨道（设置页用，截图验证不交互）
import React, { useState } from 'react'
import { View } from 'react-native'

export default function Slider({ value = 0, minimumValue = 0, maximumValue = 1, onValueChange, style, ...rest }) {
  const pct = ((value - minimumValue) / (maximumValue - minimumValue || 1)) * 100
  return (
    <View style={[{ height: 28, justifyContent: 'center' }, style]} {...rest}>
      <View style={{ height: 3, borderRadius: 1.5, backgroundColor: 'rgba(120,120,128,0.3)', overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: '#4A90D9', borderRadius: 1.5 }} />
      </View>
    </View>
  )
}
