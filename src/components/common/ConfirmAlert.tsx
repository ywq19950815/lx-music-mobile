import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import Dialog, { type DialogType } from './Dialog'
import { useI18n } from '@/lang/index'
import Text from './Text'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

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
  showConfirm?: boolean
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
  showConfirm = true,
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
  }

  return (
    <Dialog onHide={onHide} keyHide={keyHide} bgHide={bgHide} closeBtn={closeBtn} title={title} ref={dialogRef}>
      <View style={styles.main}>
        <ScrollView style={styles.content} keyboardShouldPersistTaps={'always'}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}>
          {children ?? <Text style={styles.textBody} size={13} color={neoColors.black}>{text}</Text>}
        </ScrollView>
      </View>
      <View style={[styles.btns, reverseBtn && styles.btnsReversed]}>
        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.7}
          onPress={handleCancel}
        >
          <Text style={styles.btnText} size={13} color={neoColors.black}>
            {cancelText || t('cancel')}
          </Text>
        </TouchableOpacity>
        {showConfirm ? (
          <TouchableOpacity
            style={[styles.confirmBtn, disabledConfirm && styles.disabledBtn]}
            activeOpacity={0.7}
            onPress={handleConfirm}
            disabled={disabledConfirm}
          >
            <Text style={styles.btnText} size={13} color={neoColors.black}>
              {confirmText || t('confirm')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Dialog>
  )
})

const styles = StyleSheet.create({
  main: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  content: {
    // ⚠️ 限高别卡太紧。内容一旦超过 maxHeight，末行会被 ScrollView 裁掉
    // （症状：文字下面被切一半、读不到最后一行）。
    // 抬高到 260 并配合子内容的自适应行高，常见文案（歌单打开的 4 条提示）可完整显示。
    maxHeight: 260,
  },
  textBody: {
    lineHeight: 20,
    fontWeight: '600',
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  btnsReversed: {
    flexDirection: 'row-reverse',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: neoBorders.radiusPill,
    borderWidth: 2,
    borderColor: neoColors.black,
    backgroundColor: neoColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...neoShadows.sm,
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: neoBorders.radiusPill,
    borderWidth: 2,
    borderColor: neoColors.black,
    backgroundColor: neoColors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    ...neoShadows.sm,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  btnText: {
    fontWeight: '800',
  },
})
