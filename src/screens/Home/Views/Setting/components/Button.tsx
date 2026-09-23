import { memo } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import type { BtnProps } from '@/components/common/Button'
import Text from '@/components/common/Text'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

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
      <Text size={13.5} style={styles.text}>{children}</Text>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  button: {
    backgroundColor: neoColors.yellow,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 2.5, height: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginRight: 10,
    alignSelf: 'flex-start',
  },
  disabled: {
    backgroundColor: '#E5E5DE',
    borderColor: '#888888',
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6,
  },
  pressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOffset: { width: 0.5, height: 0.5 },
  },
  text: {
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.2,
  },
})

