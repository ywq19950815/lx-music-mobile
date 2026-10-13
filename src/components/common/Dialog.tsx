import { useImperativeHandle, forwardRef, useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { View, TouchableOpacity, StyleSheet, Animated, Easing, PanResponder } from 'react-native'
import Modal, { type ModalType } from './Modal'
import { Icon } from '@/components/common/Icon'
import { useKeyboard } from '@/utils/hooks'
import { useWindowSize } from '@/utils/hooks'
import { useNavigationBarHeight } from '@/store/common/hook'
import Text from './Text'
import { colors, radius, motion } from '@/theme/tokens'

const HEADER_HEIGHT = 46
/** 下拉关闭阈值：位移超过 96dp 或速度够快即关闭 */
const CLOSE_DISTANCE = 96
const CLOSE_VELOCITY = 0.5

export interface DialogProps {
  onHide?: () => void
  keyHide?: boolean
  bgHide?: boolean
  closeBtn?: boolean
  title?: string
  children: React.ReactNode | React.ReactNode[]
  height?: number | `${number}%`
  position?: 'bottom' | 'center'
  /** 暗色沉浸主题：用于悬浮在深色播放页之上的弹窗（毛玻璃质感） */
  theme?: 'light' | 'dark'
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
  theme = 'light',
}: DialogProps, ref) => {
  const { keyboardShown, keyboardHeight } = useKeyboard()
  const navigationBarHeight = useNavigationBarHeight()
  const { height: winHeight } = useWindowSize()
  const modalRef = useRef<ModalType>(null)
  const isDark = theme === 'dark'
  const isBottom = position === 'bottom'

  // ── 显隐状态（与内部 Modal 同步，用于驱动进出场动画）────────────
  const [show, setShow] = useState(false)
  const hidingRef = useRef(false)

  // ── 进出场动画值 ───────────────────────────────
  const translateY = useRef(new Animated.Value(winHeight)).current
  const scale = useRef(new Animated.Value(0.96)).current
  const dragY = useRef(new Animated.Value(0)).current

  // 进场：底部抽屉自屏幕外弹簧上滑；居中弹窗轻微放大
  useEffect(() => {
    if (!show) return
    if (isBottom) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.bezier(0.2, 0.9, 0.3, 1),
        useNativeDriver: true,
      }).start()
    } else {
      Animated.spring(scale, {
        toValue: 1,
        friction: motion.spring.friction,
        tension: motion.spring.tension,
        useNativeDriver: true,
      }).start()
    }
  }, [show, isBottom, translateY, scale])

  const hide = useCallback(() => {
    if (hidingRef.current) return
    hidingRef.current = true
    const finish = () => {
      hidingRef.current = false
      setShow(false)
      modalRef.current?.setVisible(false)
    }
    if (isBottom) {
      // 退场：跟手下落感（加速曲线）后卸载
      Animated.timing(translateY, {
        toValue: winHeight,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(finish)
    } else {
      Animated.timing(scale, {
        toValue: 0.96,
        duration: motion.durationFast,
        useNativeDriver: true,
      }).start(finish)
    }
  }, [isBottom, translateY, scale, winHeight])

  useImperativeHandle(ref, () => ({
    setVisible(visible: boolean) {
      if (visible) {
        // 重置动画基准，保证下次进场从屏幕外开始
        hidingRef.current = false
        dragY.setValue(0)
        translateY.setValue(winHeight)
        setShow(true)
        modalRef.current?.setVisible(true)
      } else {
        hide()
      }
    },
  }))

  // ── 抓手区域下拉关闭手势（仅底部抽屉）────────────
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => isBottom && !hidingRef.current && g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_e, g) => {
      dragY.setValue(Math.max(0, g.dy))
    },
    onPanResponderRelease: (_e, g) => {
      if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_VELOCITY) {
        hide()
      } else {
        Animated.spring(dragY, {
          toValue: 0,
          friction: motion.spring.friction,
          tension: motion.spring.tension,
          useNativeDriver: true,
        }).start()
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(dragY, {
        toValue: 0,
        friction: motion.spring.friction,
        tension: motion.spring.tension,
        useNativeDriver: true,
      }).start()
    },
  }), [isBottom, dragY, hide])

  const closeBtnComponent = useMemo(() => {
    return closeBtn
      ? (
          <TouchableOpacity
            style={[styles.closeBtn, isDark && styles.closeBtnDark]}
            activeOpacity={0.7}
            onPress={hide}
          >
            <Icon name="close" color={isDark ? 'rgba(255,255,255,0.7)' : colors.inkSecondary} size={13} />
          </TouchableOpacity>
        )
      : null
  }, [closeBtn, isDark, hide])

  const cardTransform = useMemo(() => (
    isBottom
      ? [{ translateY: Animated.add(translateY, dragY) }]
      : [{ scale }]
  ), [isBottom, translateY, dragY, scale])

  return (
    <Modal
      onHide={onHide}
      keyHide={keyHide}
      bgHide={false}
      onBgPress={bgHide ? hide : undefined}
      onRequestClose={hide}
      bgColor={isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.45)'}
      ref={modalRef}
    >
      <View
        style={[
          isBottom ? styles.bottomView : styles.centeredView,
          { paddingBottom: keyboardShown ? keyboardHeight : 0 },
        ]}
      >
        <Animated.View
          style={[
            isBottom ? styles.bottomSheetCard : styles.centeredModalCard,
            isDark && styles.cardDark,
            height ? { height } : null,
            { transform: cardTransform },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {isBottom ? (
            /* 抓手 + 标题区：支持下拉关闭手势 */
            <View style={styles.handleContainer} {...panResponder.panHandlers}>
              <View style={[styles.handleBar, isDark && styles.handleBarDark]} />

              {title || closeBtn ? (
                <View style={[styles.header, isDark && styles.headerDark]}>
                  <View style={styles.headerTitleBox}>
                    <View style={styles.headerDot} />
                    <Text style={styles.title} size={15} color={isDark ? '#FFFFFF' : colors.ink} numberOfLines={1}>
                      {title}
                    </Text>
                  </View>
                  {closeBtnComponent}
                </View>
              ) : null}
            </View>
          ) : null}

          {!isBottom && (title || closeBtn) ? (
            <View style={[styles.header, isDark && styles.headerDark]}>
              <View style={styles.headerTitleBox}>
                <View style={styles.headerDot} />
                <Text style={styles.title} size={15} color={isDark ? '#FFFFFF' : colors.ink} numberOfLines={1}>
                  {title}
                </Text>
              </View>
              {closeBtnComponent}
            </View>
          ) : null}

          <View style={[
            styles.body,
            height ? { flex: 1 } : null,
            isDark && styles.bodyDark,
            isBottom && { paddingBottom: Math.max(navigationBarHeight, 18) },
          ]}>
            {children}
          </View>
        </Animated.View>
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
  handleBarDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
  // ── 暗色沉浸主题（悬浮于深色播放页）────────────
  cardDark: {
    backgroundColor: 'rgba(28, 30, 38, 0.96)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerDark: {
    backgroundColor: 'rgba(28, 30, 38, 0.96)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  bodyDark: {
    backgroundColor: 'rgba(28, 30, 38, 0.96)',
  },
  closeBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
})
