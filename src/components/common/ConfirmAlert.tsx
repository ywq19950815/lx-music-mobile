import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import Dialog, { type DialogType } from './Dialog'
import { useI18n } from '@/lang/index'
import Text from './Text'
import { colors, radius } from '@/theme/tokens'

export interface ConfirmAlertProps {
  onCancel?: () => void
  onHide?: () => void
  onConfirm?: () => void
  keyHide?: boolean
  bgHide?: boolean
  closeBtn?: boolean
  title?: string
  text?: string
  cancelText?: string
  confirmText?: string
  btnText?: string
  showConfirm?: boolean
  showCancel?: boolean
  autoHideOnConfirm?: boolean
  disabledConfirm?: boolean
  reverseBtn?: boolean
  children?: React.ReactNode | React.ReactNode[]
}

export interface ConfirmAlertType {
  setVisible: (visible: boolean) => void
}

export default forwardRef<ConfirmAlertType, ConfirmAlertProps>(({
  onHide,
  onCancel,
  onConfirm = () => {},
  keyHide,
  bgHide,
  closeBtn,
  title = '',
  text = '',
  cancelText = '',
  confirmText = '',
  btnText = '',
  showConfirm = true,
  showCancel = true,
  autoHideOnConfirm = false,
  disabledConfirm = false,
  children,
  reverseBtn = false,
}: ConfirmAlertProps, ref) => {
  const t = useI18n()
  const dialogRef = useRef<DialogType>(null)

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) {
      dialogRef.current?.setVisible(visible)
    },
  }))

  const handleCancel = () => {
    onCancel?.()
    dialogRef.current?.setVisible(false)
  }

  const handleConfirm = () => {
    if (disabledConfirm) return
    onConfirm?.()
    if (autoHideOnConfirm || !showCancel) {
      dialogRef.current?.setVisible(false)
    }
  }

  return (
    <Dialog
      onHide={onHide}
      keyHide={keyHide}
      bgHide={bgHide}
      closeBtn={closeBtn}
      title={title}
      position="center"
      ref={dialogRef}
    >
      <View style={styles.main}>
        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps={'always'}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {children ?? <Text style={styles.textBody} size={13.5} color={colors.inkSecondary}>{text}</Text>}
        </ScrollView>
      </View>
      <View style={[styles.btns, reverseBtn && styles.btnsReversed]}>
        {showCancel ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.7}
            onPress={handleCancel}
          >
            <Text style={styles.cancelBtnText} size={13}>
              {cancelText || t('cancel')}
            </Text>
          </TouchableOpacity>
        ) : null}
        {showConfirm ? (
          <TouchableOpacity
            style={[styles.confirmBtn, disabledConfirm && styles.disabledBtn]}
            activeOpacity={0.7}
            onPress={handleConfirm}
            disabled={disabledConfirm}
          >
            <Text style={styles.confirmBtnText} size={13}>
              {confirmText || btnText || t('confirm')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Dialog>
  )
})

const styles = StyleSheet.create({
  main: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
  },
  content: {
    maxHeight: 280,
  },
  textBody: {
    lineHeight: 22,
    fontWeight: '400',
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 10,
  },
  btnsReversed: {
    flexDirection: 'row-reverse',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledBtn: {
    opacity: 0.45,
  },
})
