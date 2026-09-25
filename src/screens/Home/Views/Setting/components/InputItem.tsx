import { memo, useState, useEffect, useRef } from 'react'
import { StyleSheet, View, Keyboard } from 'react-native'
import type { InputType, InputProps } from '@/components/common/Input'
import Input from '@/components/common/Input'
import Text from '@/components/common/Text'
import { colors, radius } from '@/theme/tokens'

export interface InputItemProps extends InputProps {
  value: string
  label: string
  onChanged: (text: string, callback: (vlaue: string) => void) => void
}

export default memo(({ value, label, onChanged, ...props }: InputItemProps) => {
  const [text, setText] = useState(value)
  const textRef = useRef(value)
  const isMountRef = useRef(false)
  const inputRef = useRef<InputType>(null)

  const saveValue = () => {
    onChanged?.(text, (val: string) => {
      if (!isMountRef.current) return
      const newValue = String(val)
      setText(newValue)
      textRef.current = newValue
    })
  }

  useEffect(() => {
    isMountRef.current = true
    return () => {
      isMountRef.current = false
    }
  }, [])

  useEffect(() => {
    const handleKeyboardDidHide = () => {
      if (!inputRef.current?.isFocused()) return
      onChanged?.(textRef.current, val => {
        if (!isMountRef.current) return
        const newValue = String(val)
        setText(newValue)
        textRef.current = newValue
      })
    }
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', handleKeyboardDidHide)

    return () => {
      keyboardDidHide.remove()
    }
  }, [onChanged])

  useEffect(() => {
    if (value != text) {
      const newValue = String(value)
      setText(newValue)
      textRef.current = newValue
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleSetSelectMode = (val: string) => {
    setText(val)
    textRef.current = val
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label} size={13.5}>{label}</Text>
      <Input
        value={text}
        ref={inputRef}
        onChangeText={handleSetSelectMode}
        style={styles.input}
        {...props}
        onBlur={saveValue}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    marginBottom: 8,
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
    color: colors.ink,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.ink,
    fontSize: 13.5,
    maxWidth: 320,
  },
})
