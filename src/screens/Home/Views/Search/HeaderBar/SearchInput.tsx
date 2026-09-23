import { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import Input, { type InputType, type InputProps } from '@/components/common/Input'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

export interface SearchInputProps {
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

export default forwardRef<SearchInputType, SearchInputProps>(({ onChangeText, onSubmit, onBlur, onTouchStart }, ref) => {
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
        <View style={styles.searchIconBox}>
          <Icon name="search" size={14} color={neoColors.black} />
        </View>
        <Input
          ref={inputRef}
          placeholder="搜索音乐、歌手、歌单..."
          placeholderTextColor="#777777"
          value={text}
          onChangeText={handleChangeText}
          style={styles.input}
          onBlur={onBlur}
          onSubmitEditing={handleSubmit}
          onClearText={handleClearText}
          onTouchStart={onTouchStart}
          clearBtn
        />
        {/* Neo-Brutalism 实体搜索按钮 */}
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
    paddingVertical: 3,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: neoColors.white,
    borderWidth: 2,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusPill,
    height: 34,
    paddingLeft: 8,
    paddingRight: 3,
    shadowColor: neoColors.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  searchIconBox: {
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: neoColors.black,
    height: '100%',
    padding: 0,
  },
  searchBtn: {
    backgroundColor: neoColors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: neoBorders.radiusPill,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: neoColors.black,
    fontWeight: '900',
    fontSize: 12,
  },
})
