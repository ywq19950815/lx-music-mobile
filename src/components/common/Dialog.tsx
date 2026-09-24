import { useImperativeHandle, forwardRef, useMemo, useRef } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import Modal, { type ModalType } from './Modal'
import { Icon } from '@/components/common/Icon'
import { useKeyboard } from '@/utils/hooks'
import Text from './Text'
import { colors, radius } from '@/theme/tokens'

const HEADER_HEIGHT = 42

export interface DialogProps {
  onHide?: () => void
  keyHide?: boolean
  bgHide?: boolean
  closeBtn?: boolean
  title?: string
  children: React.ReactNode | React.ReactNode[]
  height?: number | `${number}%`
}

export interface DialogType {
  setVisible: (visible: boolean) => void
}

export default forwardRef<DialogType, DialogProps>(({
  onHide,
  keyHide = true,
  bgHide = true,
  closeBtn = true,
  title = '',
  children,
  height,
}: DialogProps, ref) => {
  const { keyboardShown, keyboardHeight } = useKeyboard()
  const modalRef = useRef<ModalType>(null)

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) {
      modalRef.current?.setVisible(visible)
    },
  }))

  const closeBtnComponent = useMemo(() => {
    return closeBtn
      ? (
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.7}
            onPress={() => modalRef.current?.setVisible(false)}
          >
            <Icon name="close" color={colors.inkSecondary} size={14} />
          </TouchableOpacity>
        )
      : null
  }, [closeBtn])

  return (
    <Modal onHide={onHide} keyHide={keyHide} bgHide={bgHide} bgColor="rgba(0, 0, 0, 0.45)" ref={modalRef}>
      <View style={[styles.centeredView, { paddingBottom: keyboardShown ? keyboardHeight : 0 }]}>
        <View style={[styles.modalCard, height ? { height } : null]} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <View style={styles.headerDot} />
              <Text style={styles.title} size={14} color={colors.ink} numberOfLines={1}>
                {title}
              </Text>
            </View>
            {closeBtnComponent}
          </View>
          <View style={styles.body}>
            {children}
          </View>
        </View>
      </View>
    </Modal>
  )
})

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    maxWidth: '92%',
    minWidth: '75%',
    maxHeight: '82%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    height: HEADER_HEIGHT,
    paddingHorizontal: 14,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerDot: {
    width: 3.5,
    height: 13,
    borderRadius: 2,
    backgroundColor: colors.brand,
    marginRight: 8,
  },
  title: {
    fontWeight: '700',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    backgroundColor: colors.surface,
  },
})
