import { memo } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import type { BtnProps } from '@/components/common/Button'
import Text from '@/components/common/Text'
import { colors, radius } from '@/theme/tokens'

type ButtonProps = BtnProps

export default memo(({ disabled, onPress, children }: ButtonProps) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        !disabled && pressed && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text size={13} style={styles.text}>{children}</Text>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 10,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
  text: {
    fontWeight: '600',
    color: colors.ink,
  },
})

