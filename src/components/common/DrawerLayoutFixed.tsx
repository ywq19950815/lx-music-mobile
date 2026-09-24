import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native'
import Text from '@/components/common/Text'
import { colors, radius } from '@/theme/tokens'
import { useNavActiveId } from '@/store/common/hook'

export interface DrawerLayoutFixedType {
  openDrawer: () => void
  closeDrawer: () => void
  fixWidth: () => void
}

export interface DrawerLayoutFixedProps {
  visibleNavNames?: any[]
  widthPercentage?: number
  widthPercentageMax?: number
  drawerPosition?: 'left' | 'right'
  renderNavigationView?: () => ReactNode
  drawerBackgroundColor?: string
  title?: string
  drawerTitle?: string
  style?: any
  children?: ReactNode
}

/**
 * NeoBottomSheetDrawer: 新粗野主义风格的全局底部弹出抽屉。
 * 替代老旧易冲突的 Android 侧边栏抽屉，实现大拇指黄金触达与统一视觉。
 * - 纯黑半透明遮罩，点击任意非抽屉区域平滑退出
 * - 底部平滑自底升起动画（240ms cubic 缓动）
 * - 顶部黑色拖拽把手 + 亮黄波普标题横幅与关闭按钮
 * - 纯白/米奶底纸卡片 + 2.5px 纯黑粗边框
 */
const DrawerLayoutFixed = forwardRef<DrawerLayoutFixedType, DrawerLayoutFixedProps>(({
  children,
  renderNavigationView,
  title,
  drawerTitle,
  style,
}, ref) => {
  const [visible, setVisible] = useState(false)
  const navActiveId = useNavActiveId()

  const slideAnim = useRef(new Animated.Value(500)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  const displayTitle = title || drawerTitle || (() => {
    switch (navActiveId) {
      case 'nav_love':
        return '📋 我的歌单与分类'
      case 'nav_songlist':
        return '🏷️ 歌单分类标签'
      case 'nav_top':
        return '🏆 官方排行榜单'
      default:
        return '📋 分类与列表'
    }
  })()

  const open = useCallback(() => {
    setVisible(true)
    slideAnim.setValue(500)
    fadeAnim.setValue(0)
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [fadeAnim, slideAnim])

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setVisible(false)
    })
  }, [fadeAnim, slideAnim])

  useImperativeHandle(ref, () => ({
    openDrawer() {
      open()
    },
    closeDrawer() {
      close()
    },
    fixWidth() {
      // 保持向前兼容性 no-op
    },
  }), [open, close])

  return (
    <View style={[styles.rootContainer, style]}>
      {/* 页面主界面内容 */}
      <View style={styles.childContainer}>
        {children}
      </View>

      {/* 底部滑出卡片面板 (Bottom Sheet) */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={styles.modalOverlay}>
          {/* 半透明黑色遮罩，点击外部收起 */}
          <TouchableWithoutFeedback onPress={close}>
            <Animated.View
              style={[
                styles.backdrop,
                { opacity: fadeAnim },
              ]}
            />
          </TouchableWithoutFeedback>

          {/* 底部波普卡片主体 */}
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* 顶部黑色拖拽指示把手 */}
            <View style={styles.dragHandle} />

            {/* 顶部波普标题栏 */}
            <View style={styles.headerBar}>
              <View style={styles.titleWrap}>
                <Text style={styles.headerTitle}>{displayTitle}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={close}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 抽屉内容容器：自适应高度并流畅滚动 */}
            <View style={styles.contentWrap}>
              {typeof renderNavigationView === 'function' ? renderNavigationView() : null}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  )
})

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    position: 'relative',
  },
  childContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: colors.hairline,
    height: '75%',
    maxHeight: '80%',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 32 : 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 25,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E2E7',
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    marginBottom: 8,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSecondary,
    lineHeight: 14,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 8,
  },
})

export default DrawerLayoutFixed
