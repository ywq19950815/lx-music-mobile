import { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'

export interface SearchInputProps {
  prefix?: React.ReactNode
  onChangeText: (text: string) => void
  onSubmit: (text: string) => void
  onBlur: () => void
  onTouchStart: () => void
}

export interface SearchInputType {
  setText: (text: string) => void
  focus: () => void
  blur: () => void
}

export default forwardRef<SearchInputType, SearchInputProps>(({ prefix, onChangeText, onSubmit, onBlur, onTouchStart }, ref) => {
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)

  useImperativeHandle(ref, () => ({
    setText(newText) {
      setText(newText)
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
          <Icon name="search-2" size={14} color="#8A909B" />
        </View>
        <Input
          ref={inputRef}
          placeholder="搜索音乐、歌手、歌单..."
          placeholderTextColor="#9AA0AA"
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
          style={styles.searchBtn}
          onPress={handleSubmit}
          activeOpacity={0.7}
        >
          <Text style={styles.searchBtnText}>搜索</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  inputWrapper: {
    flex: 1,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E6E8EC',
    borderRadius: 19,
    height: 38,
    paddingLeft: 4,
    paddingRight: 4,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  verticalDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#D1D5DB',
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
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1C20',
    height: '100%',
    padding: 0,
  },
  searchBtn: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
})
