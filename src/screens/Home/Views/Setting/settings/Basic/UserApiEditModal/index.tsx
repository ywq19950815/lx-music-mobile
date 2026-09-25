import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import Text from '@/components/common/Text'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useI18n } from '@/lang'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import List from './List'
import ImportBtn from './ImportBtn'
import { colors, radius } from '@/theme/tokens'

export interface UserApiEditModalType {
  show: () => void
}

export default forwardRef<UserApiEditModalType, {}>((props, ref) => {
  const dialogRef = useRef<DialogType>(null)
  const [visible, setVisible] = useState(false)
  const t = useI18n()

  const handleShow = () => {
    dialogRef.current?.setVisible(true)
  }

  useImperativeHandle(ref, () => ({
    show() {
      if (visible) handleShow()
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow()
        })
      }
    },
  }))

  const handleCancel = () => {
    dialogRef.current?.setVisible(false)
  }

  return (
    visible
      ? (
          <Dialog ref={dialogRef} bgHide={false} title={t('user_api_title') || '自定义源管理'}>
            <View style={styles.content}>
              <List />
              <View style={styles.tips}>
                <Text style={styles.tipsText} size={12}>
                  {t('user_api_readme')}
                </Text>
                <View>
                  <Text style={styles.tipsText} size={12}>{t('user_api_note')}</Text>
                </View>
              </View>
            </View>
            <View style={styles.btns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text size={13.5} style={styles.cancelText}>{t('close')}</Text>
              </TouchableOpacity>
              <ImportBtn btnStyle={styles.importBtn} />
            </View>
          </Dialog>
        ) : null
  )
})

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'column',
  },
  tips: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: radius.md,
  },
  tipsText: {
    lineHeight: 18,
    color: colors.inkTertiary,
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: 18,
    paddingHorizontal: 16,
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  importBtn: {
    paddingVertical: 9,
    paddingHorizontal: 20,
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
})
