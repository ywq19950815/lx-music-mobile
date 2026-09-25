import { useState, useRef, useEffect } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { Icon } from '@/components/common/Icon'
import { confirmDialog } from '@/utils/tools'
import { useI18n } from '@/lang'
import { createUserList } from '@/core/list'
import listState from '@/store/list/state'
import { colors, radius } from '@/theme/tokens'

export default ({ isEdit, onHide }: {
  isEdit: boolean
  onHide: () => void
}) => {
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)
  const t = useI18n()

  useEffect(() => {
    if (isEdit) {
      setText('')
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [isEdit])

  const handleSubmit = async() => {
    const name = text.trim()
    if (!name.length) {
      onHide()
      return
    }
    if (listState.userList.some(l => l.name == name) && !(await confirmDialog({
      message: global.i18n.t('list_duplicate_tip'),
    }))) {
      return
    }
    onHide()
    void createUserList(listState.userList.length, [{ id: `userlist_${Date.now()}`, name, locationUpdateTime: null }])
  }

  return isEdit ? (
    <View style={styles.inputContainer}>
      <Input
        placeholder={t('list_create_input_placeholder') || '输入新建歌单名称'}
        value={text}
        onChangeText={setText}
        ref={inputRef}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        style={styles.input}
      />
      <TouchableOpacity
        style={styles.confirmBtn}
        onPress={handleSubmit}
        activeOpacity={0.7}
      >
        <Text style={styles.confirmText}>确定</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={onHide}
        activeOpacity={0.7}
      >
        <Icon name="close" size={12} color={colors.inkTertiary} />
      </TouchableOpacity>
    </View>
  ) : null
}

import Text from '@/components/common/Text'

const styles = StyleSheet.create({
  inputContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.ink,
  },
  confirmBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
