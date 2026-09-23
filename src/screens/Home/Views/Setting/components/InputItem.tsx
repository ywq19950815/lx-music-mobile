import { memo, useState, useEffect, useRef } from 'react'
import { StyleSheet, View, Keyboard } from 'react-native'
import type { InputType, InputProps } from '@/components/common/Input'
import Input from '@/components/common/Input'
import Text from '@/components/common/Text'

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
    paddingLeft: 4,
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    fontWeight: '800',
    color: '#000000',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
    color: '#000000',
    maxWidth: 320,
  },
})

