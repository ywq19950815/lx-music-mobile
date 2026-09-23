import { useImperativeHandle, forwardRef, useMemo, useRef } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import Modal, { type ModalType } from './Modal'
import { Icon } from '@/components/common/Icon'
import { useKeyboard } from '@/utils/hooks'
import Text from './Text'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

const HEADER_HEIGHT = 34

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
            <Icon name="close" color={neoColors.black} size={14} />
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
              <Text style={styles.title} size={14} color={neoColors.black} numberOfLines={1}>
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
    backgroundColor: neoColors.white,
    borderRadius: neoBorders.radiusMd,
    borderWidth: 2.5,
    borderColor: neoColors.black,
    ...neoShadows.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: neoColors.yellow,
    borderBottomWidth: 2,
    borderBottomColor: neoColors.black,
    height: HEADER_HEIGHT,
    paddingHorizontal: 10,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: neoColors.black,
    marginRight: 6,
  },
  title: {
    fontWeight: '900',
  },
  closeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    backgroundColor: neoColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...neoShadows.sm,
  },
  body: {
    backgroundColor: neoColors.offWhite,
  },
})
