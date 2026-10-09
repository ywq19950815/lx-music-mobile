import React, { useRef, forwardRef, useImperativeHandle } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { colors } from '@/theme/tokens'

export interface SearchBarProps {
  keyword: string
  isSearching: boolean
  onChangeKeyword: (text: string) => void
  onSearch: (text: string) => void
  onClear: () => void
  onCancel: () => void
  onFocus: () => void
}

export interface SearchBarType {
  focus: () => void
  blur: () => void
}

export default forwardRef<SearchBarType, SearchBarProps>(({
  keyword,
  isSearching,
  onChangeKeyword,
  onSearch,
  onClear,
  onCancel,
  onFocus,
}, ref) => {
  const inputRef = useRef<TextInput>(null)

  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current?.focus()
    },
    blur() {
      inputRef.current?.blur()
    },
  }))

  const handleSubmit = () => {
    Keyboard.dismiss()
    onSearch(keyword.trim())
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputWrap}>
        <Icon name="search-2" size={15} color={colors.inkSecondary} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={keyword}
          placeholder="搜索歌单、标签..."
          placeholderTextColor={colors.inkTertiary}
          returnKeyType="search"
          onChangeText={onChangeKeyword}
          onSubmitEditing={handleSubmit}
          onFocus={onFocus}
        />
        {keyword ? (
          <TouchableOpacity
            style={styles.clearBtn}
            activeOpacity={0.7}
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearText}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {isSearching ? (
        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.7}
          onPress={() => {
            Keyboard.dismiss()
            onCancel()
          }}
        >
          <Text style={styles.cancelText}>取消</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F2F5',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
    paddingVertical: 0,
    marginLeft: 8,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  clearText: {
    fontSize: 14,
    lineHeight: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelBtn: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 14,
    color: colors.brand,
    fontWeight: '600',
  },
})
