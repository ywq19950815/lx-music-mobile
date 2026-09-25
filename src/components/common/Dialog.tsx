import { useImperativeHandle, forwardRef, useMemo, useRef } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import Modal, { type ModalType } from './Modal'
import { Icon } from '@/components/common/Icon'
import { useKeyboard } from '@/utils/hooks'
import Text from './Text'
import { colors, radius } from '@/theme/tokens'

const HEADER_HEIGHT = 46

export interface DialogProps {
  onHide?: () => void
  keyHide?: boolean
  bgHide?: boolean
  closeBtn?: boolean
  title?: string
  children: React.ReactNode | React.ReactNode[]
  height?: number | `${number}%`
  position?: 'bottom' | 'center'
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
  position = 'bottom',
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
            <Icon name="close" color={colors.inkSecondary} size={13} />
          </TouchableOpacity>
        )
      : null
  }, [closeBtn])

  const isBottom = position === 'bottom'

  return (
    <Modal onHide={onHide} keyHide={keyHide} bgHide={bgHide} bgColor="rgba(0, 0, 0, 0.45)" ref={modalRef}>
      <View
        style={[
          isBottom ? styles.bottomView : styles.centeredView,
          { paddingBottom: keyboardShown ? keyboardHeight : (isBottom ? 20 : 0) },
        ]}
      >
        <View
          style={[
            isBottom ? styles.bottomSheetCard : styles.centeredModalCard,
            height ? { height } : null,
          ]}
          onStartShouldSetResponder={() => true}
        >
          {isBottom ? (
            <View style={styles.handleContainer}>
              <View style={styles.handleBar} />
            </View>
          ) : null}

          {title || closeBtn ? (
            <View style={styles.header}>
              <View style={styles.headerTitleBox}>
                <View style={styles.headerDot} />
                <Text style={styles.title} size={15} color={colors.ink} numberOfLines={1}>
                  {title}
                </Text>
              </View>
              {closeBtnComponent}
            </View>
          ) : null}

          <View style={styles.body}>
            {children}
          </View>
        </View>
      </View>
    </Modal>
  )
})

const styles = StyleSheet.create({
  // 底部抽屉模式（QQ音乐现代交互标准：表单与操作从底部弹出）
  bottomView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bottomSheetCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: '#ECEEF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },

  // 居中模式（轻量确认弹窗专用）
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  centeredModalCard: {
    maxWidth: '90%',
    minWidth: '75%',
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
    height: HEADER_HEIGHT,
    paddingHorizontal: 16,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerDot: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.brand,
    marginRight: 8,
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    backgroundColor: '#FFFFFF',
  },
})
