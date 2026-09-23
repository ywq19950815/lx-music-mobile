import { useRef, useImperativeHandle, forwardRef, useCallback, useState, useEffect } from 'react'
import { TextInput, View, TouchableOpacity, StyleSheet, type TextInputProps } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { setSpText } from '@/utils/pixelRatio'

const styles = createStyle({
  content: {
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'center',
  },
  input: {
    borderRadius: 2,
    paddingTop: 0,
    paddingBottom: 0,
    height: 32,
    paddingLeft: 5,
    paddingRight: 0,
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 14,
  },
  clearBtnContent: {
    flexGrow: 0,
    flexShrink: 0,
  },
  // 清空按钮：无底色无边框的纯 ✕（不给它画框，避免在胶囊输入框里出现「框中框」），
  // 靠 24×24 的点击区 + hitSlop 保证可点性
  clearBtn: {
    width: 24,
    height: 24,
    marginLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export interface InputProps extends TextInputProps {
  onChangeText?: (value: string) => void
  onClearText?: () => void
  clearBtn?: boolean
  size?: number
}


export interface InputType {
  blur: () => void
  focus: () => void
  clear: () => void
  isFocused: () => boolean
}

export default forwardRef<InputType, InputProps>(({ onChangeText, onClearText, clearBtn, style, size = 14, placeholderTextColor, value, ...props }, ref) => {
  const inputRef = useRef<TextInput>(null)
  const theme = useTheme()
  // 清空按钮只在有内容时出现（受控 value 变化时同步，例如父级调用 clear()）
  const [hasText, setHasText] = useState(typeof value === 'string' ? value.length > 0 : false)

  useEffect(() => {
    if (typeof value === 'string') setHasText(value.length > 0)
  }, [value])

  useImperativeHandle(ref, () => ({
    blur() {
      inputRef.current?.blur()
    },
    focus() {
      inputRef.current?.focus()
    },
    clear() {
      inputRef.current?.clear()
      setHasText(false)
    },
    isFocused() {
      return inputRef.current?.isFocused() ?? false
    },
  }))

  const clearText = useCallback(() => {
    inputRef.current?.clear()
    setHasText(false)
    onChangeText?.('')
    onClearText?.()
  }, [onChangeText, onClearText])

  const changeText = useCallback((text: string) => {
    setHasText(text.length > 0)
    onChangeText?.(text)
  }, [onChangeText])

  return (
    <View style={styles.content}>
      <TextInput
        autoCapitalize="none"
        onChangeText={changeText}
        autoComplete="off"
        value={value}
        style={StyleSheet.compose({ ...styles.input, color: theme['c-font'], fontSize: setSpText(size) }, style)}
        placeholderTextColor={placeholderTextColor ?? '#8A8A85'}
        selectionColor={theme['c-primary-light-100-alpha-300']}
        ref={inputRef} {...props} />
      {
        clearBtn && hasText
          ? (
              <View style={styles.clearBtnContent}>
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={clearText}
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="clear"
                >
                  {/* 纯黑大号 ✕：之前用主题色半透明小图标，浅底上基本看不清 */}
                  <Icon allowFontScaling={false} name="remove" color="#000000" size={14} />
                </TouchableOpacity>
              </View>
            )
          : null
      }
    </View>
  )
})

