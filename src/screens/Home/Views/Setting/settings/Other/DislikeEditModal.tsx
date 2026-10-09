import { useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react'
import Text from '@/components/common/Text'
import { type LayoutChangeEvent, View, TouchableOpacity, StyleSheet } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { useI18n } from '@/lang'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import { colors, radius } from '@/theme/tokens'

interface RuleInputType {
  setText: (text: string) => void
  getText: () => string
  focus: () => void
}
const RuleInput = forwardRef<RuleInputType, {}>((props, ref) => {
  const t = useI18n()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)
  const [height, setHeight] = useState(120)

  useImperativeHandle(ref, () => ({
    getText() {
      return text.trim()
    },
    setText(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    },
  }))

  const handleLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    setHeight(nativeEvent.layout.height)
  }, [])

  return (
    <View style={styles.inputContent} onLayout={handleLayout}>
      <Input
        ref={inputRef}
        value={text}
        onChangeText={setText}
        multiline
        textAlignVertical="top"
        placeholder={t('setting_dislike_list_input_tip')}
        size={13}
        style={[styles.input, { height }]}
      />
    </View>
  )
})

export interface DislikeEditModalProps {
  onSave: (rules: string) => void
}
export interface DislikeEditModalType {
  show: (rules: string) => void
}

export default forwardRef<DislikeEditModalType, DislikeEditModalProps>(({ onSave }, ref) => {
  const dialogRef = useRef<DialogType>(null)
  const inputRef = useRef<RuleInputType>(null)
  const [visible, setVisible] = useState(false)
  const t = useI18n()

  const handleShow = (rules: string) => {
    dialogRef.current?.setVisible(true)
    requestAnimationFrame(() => {
      inputRef.current?.setText(rules.length ? rules + '\n' : rules)
    })
  }
  useImperativeHandle(ref, () => ({
    show(rules) {
      if (visible) handleShow(rules)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow(rules)
        })
      }
    },
  }))

  const handleCancel = () => {
    dialogRef.current?.setVisible(false)
  }
  const handleConfirm = () => {
    let rules = inputRef.current?.getText() ?? ''
    handleCancel()
    onSave(rules)
  }

  return (
    visible
      ? (
          <Dialog height="80%" ref={dialogRef} bgHide={false} title={t('setting__other_dislike_list') || '屏蔽词设置'}>
            <View style={styles.content}>
              <RuleInput ref={inputRef} />
              <Text style={styles.inputTipText} size={12}>{t('setting_dislike_list_tips')}</Text>
            </View>
            <View style={styles.btns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text size={13.5} style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                activeOpacity={0.7}
              >
                <Text size={13.5} style={styles.confirmText}>{t('confirm')}</Text>
              </TouchableOpacity>
            </View>
          </Dialog>
        ) : null
  )
})

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'column',
  },
  inputContent: {
    flexGrow: 1,
    flexShrink: 1,
  },
  input: {
    minWidth: 290,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    color: colors.ink,
    fontSize: 13,
  },
  inputTipText: {
    marginTop: 10,
    lineHeight: 18,
    color: colors.inkTertiary,
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  confirmBtn: {
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
})


