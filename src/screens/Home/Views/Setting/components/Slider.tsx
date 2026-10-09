import { memo } from 'react'
import Slider, { type SliderProps } from '@react-native-community/slider'
import { StyleSheet } from 'react-native'
import { colors } from '@/theme/tokens'

export type {
  SliderProps,
}

export default memo(({ value, minimumValue, maximumValue, onSlidingStart, onSlidingComplete, onValueChange, step }: SliderProps) => {
  return (
    <Slider
      value={value}
      style={styles.slider}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      minimumTrackTintColor={colors.brand}
      maximumTrackTintColor="#E2E8F0"
      thumbTintColor={colors.brand}
      onSlidingStart={onSlidingStart}
      onSlidingComplete={onSlidingComplete}
      onValueChange={onValueChange}
      step={step}
    />
  )
})

const styles = StyleSheet.create({
  slider: {
    flexShrink: 0,
    flexGrow: 1,
    maxWidth: 300,
    height: 40,
    marginTop: -6,
  },
})
