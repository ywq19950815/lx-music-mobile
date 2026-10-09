import { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { colors } from '@/theme/tokens'

export interface SearchInputProps {
  prefix?: React.ReactNode
  placeholder?: string
  onChangeText: (text: string) => void
  onSubmit: (text: string) => void
  onBlur: () => void
  onTouchStart: () => void
}

export interface SearchInputType {
  setText: (text: string) => void
  setPlaceholder: (holder: string) => void
  focus: () => void
  blur: () => void
}

export default forwardRef<SearchInputType, SearchInputProps>(({ prefix, placeholder = '搜索单曲、歌手、专辑...', onChangeText, onSubmit, onBlur, onTouchStart }, ref) => {
  const [text, setText] = useState('')
  const [currentHolder, setCurrentHolder] = useState(placeholder)
  const inputRef = useRef<InputType>(null)

  useImperativeHandle(ref, () => ({
    setText(newText) {
      setText(newText)
    },
    setPlaceholder(holder) {
      setCurrentHolder(holder)
    },
    focus() {
      inputRef.current?.focus()
    },
    blur() {
      inputRef.current?.blur()
    },
  }))

  const handleChangeText = (val: string) => {
    setText(val)
    onChangeText(val.trim())
  }

  const handleClearText = useCallback(() => {
    setText('')
    onChangeText('')
    onSubmit('')
  }, [onChangeText, onSubmit])

  const handleSubmit = useCallback(() => {
    if (text.trim()) {
      onSubmit(text.trim())
    }
  }, [onSubmit, text])

  const hasContent = text.trim().length > 0

  return (
    <View style={styles.inputWrapper}>
      <View style={styles.searchBox}>
        {prefix ? (
          <View style={styles.prefixContainer}>
            {prefix}
            <View style={styles.verticalDivider} />
          </View>
        ) : null}
        <View style={styles.searchIconBox}>
          <Icon name="search-2" size={14} color="#94A3B8" />
        </View>
        <Input
          ref={inputRef}
          placeholder={currentHolder}
          placeholderTextColor="#94A3B8"
          value={text}
          onChangeText={handleChangeText}
          style={styles.input}
          onBlur={onBlur}
          onSubmitEditing={handleSubmit}
          onClearText={handleClearText}
          onTouchStart={onTouchStart}
          clearBtn
        />
        <TouchableOpacity
          style={[styles.searchBtn, hasContent && styles.searchBtnActive]}
          onPress={handleSubmit}
          activeOpacity={0.7}
        >
          <Text style={[styles.searchBtnText, hasContent && styles.searchBtnTextActive]}>搜索</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#EAECEF',
    borderRadius: 999,
    height: 38,
    paddingLeft: 6,
    paddingRight: 6,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  verticalDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#DCDFE6',
    marginLeft: 2,
    marginRight: 6,
  },
  searchIconBox: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: colors.ink,
    height: '100%',
    padding: 0,
  },
  searchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnActive: {
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
  },
  searchBtnText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 12.5,
  },
  searchBtnTextActive: {
    color: colors.brand,
    fontWeight: '700',
  },
})
