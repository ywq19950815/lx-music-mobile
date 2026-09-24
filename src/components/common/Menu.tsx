import { useImperativeHandle, forwardRef, useMemo, useRef, useState, type Ref } from 'react'
import { View, Animated, TouchableHighlight, StyleSheet } from 'react-native'
import { useWindowSize } from '@/utils/hooks'

import Modal, { type ModalType } from './Modal'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { colors, radius } from '@/theme/tokens'

const menuItemHeight = scaleSizeH(40)
const menuItemWidth = scaleSizeW(115)

export interface Position { w: number, h: number, x: number, y: number, menuWidth?: number, menuHeight?: number }
export interface MenuSize { width?: number, height?: number }
export type Menus = Readonly<Array<{ action: string, label: string, disabled?: boolean }>>

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0,
    backgroundColor: 'black',
  },
  menu: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    zIndex: 99999,
  },
  menuItem: {
    paddingLeft: 14,
    paddingRight: 14,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
})

interface Props<M extends Menus = Menus> {
  menus: Readonly<M>
  onPress?: (menu: M[number]) => void
  buttonPosition: Position
  menuSize: MenuSize
  onHide: () => void
  width?: number
  height?: number
  fontSize?: number
  center?: boolean
  activeId?: M[number]['action'] | null
}

const Menu = ({
  buttonPosition,
  menuSize,
  menus,
  width,
  height,
  onPress = () => {},
  onHide,
  activeId,
  fontSize = 15,
  center = false,
}: Props) => {
  const theme = useTheme()
  const windowSize = useWindowSize()
  // const fadeAnim = useRef(new Animated.Value(0)).current
  // console.log(buttonPosition)

  const menuItemStyle = useMemo(() => {
    return {
      width: width ?? menuSize.width ?? menuItemWidth,
      height: height ?? menuSize.height ?? menuItemHeight,
    }
  }, [menuSize, width, height])

  const menuStyle = useMemo(() => {
    const itemHeight = menuItemStyle.height
    const itemWidth = menuItemStyle.width
    let menuHeight = menus.length * itemHeight
    const maxAllowedHeight = Math.max(120, windowSize.height - 100)
    if (menuHeight > maxAllowedHeight) menuHeight = maxAllowedHeight

    // 坐标兜底保护：当 buttonPosition 异常为 0 时默认停靠在右侧偏上
    const hasValidPos = (buttonPosition.x > 0 || buttonPosition.y > 0)
    const btnX = hasValidPos ? buttonPosition.x : (windowSize.width - itemWidth - 16)
    const btnY = hasValidPos ? buttonPosition.y : 160
    const btnH = buttonPosition.h || 28
    const btnW = buttonPosition.w || 28

    const bottomSpace = windowSize.height - btnY - btnH - 16
    const showInBottom = bottomSpace >= menuHeight || bottomSpace >= 150

    let top = showInBottom ? btnY + btnH + 4 : btnY - menuHeight - 4
    top = Math.max(12, Math.min(windowSize.height - menuHeight - 16, top))

    const rightSpace = windowSize.width - btnX - itemWidth
    const showInRight = rightSpace >= itemWidth

    const frameStyle: {
      height: number
      width: number
      top: number
      left?: number
      right?: number
    } = {
      height: menuHeight,
      top,
      width: itemWidth,
    }

    if (showInRight) {
      frameStyle.left = Math.max(12, Math.min(windowSize.width - itemWidth - 12, btnX))
    } else {
      frameStyle.right = Math.max(12, Math.min(windowSize.width - itemWidth - 12, windowSize.width - btnX - btnW))
    }
    return frameStyle
  }, [menus.length, menuItemStyle, buttonPosition, windowSize])

  const menuPress = (menu: Menus[number]) => {
    // if (menu.disabled) return
    onPress(menu)
    onHide()
  }

  return (
    <View style={[styles.menu, menuStyle]} onStartShouldSetResponder={() => true}>
      <Animated.ScrollView keyboardShouldPersistTaps={'always'} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        {
          menus.map((menu, index) => {
            const isLast = index === menus.length - 1
            if (menu.disabled) {
              return (
                <View
                  key={menu.action}
                  style={[
                    styles.menuItem,
                    { width: menuItemStyle.width, height: menuItemStyle.height, opacity: 0.35 },
                    isLast && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={{ textAlign: center ? 'center' : 'left', fontWeight: '500', color: colors.inkTertiary }} size={13.5} numberOfLines={1}>
                    {menu.label}
                  </Text>
                </View>
              )
            }
            const isActive = menu.action === activeId
            return (
              <TouchableHighlight
                key={menu.action}
                style={[
                  styles.menuItem,
                  { width: menuItemStyle.width, height: menuItemStyle.height },
                  isActive && { backgroundColor: 'rgba(245, 166, 35, 0.10)' },
                  isLast && { borderBottomWidth: 0 },
                ]}
                underlayColor={'rgba(245, 166, 35, 0.08)'}
                onPress={() => { menuPress(menu) }}
              >
                <Text
                  style={{
                    textAlign: center ? 'center' : 'left',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#B36B00' : colors.ink,
                  }}
                  size={13.5}
                  numberOfLines={1}
                >
                  {menu.label}
                </Text>
              </TouchableHighlight>
            )
          })
        }
      </Animated.ScrollView>
    </View>
  )
}

export interface MenuProps<M extends Menus = Menus> {
  menus: M
  onPress: (menu: M[number]) => void
  onHide?: () => void
  width?: number
  height?: number
  fontSize?: number
  center?: boolean
  activeId?: M[number]['action'] | null
}

export interface MenuType {
  show: (position: Position, menuSize?: MenuSize) => void
  hide: () => void
}

const Component = <M extends Menus>({ menus, width, height, activeId, onHide, onPress, fontSize, center }: MenuProps<M>, ref: Ref<MenuType>) => {
  // console.log(visible)
  const modalRef = useRef<ModalType>(null)
  const [position, setPosition] = useState<Position>({ w: 0, h: 0, x: 0, y: 0 })
  const [menuSize, setMenuSize] = useState<MenuSize>({ })
  const hide = () => {
    modalRef.current?.setVisible(false)
  }
  useImperativeHandle(ref, () => ({
    show(newPosition, menuSize) {
      console.log('--- [Menu] show called with position:', JSON.stringify(newPosition))
      setPosition(newPosition)
      if (menuSize) setMenuSize(menuSize)
      modalRef.current?.setVisible(true)
    },
    hide() {
      hide()
    },
  }))

  return (
    <Modal onHide={onHide} ref={modalRef}>
      <Menu menus={menus} width={width} height={height} activeId={activeId} buttonPosition={position} menuSize={menuSize} onPress={onPress} onHide={hide} fontSize={fontSize} center={center} />
    </Modal>
  )
}

// export default forwardRef(Component) as ForwardRefFn<MenuType>
export default forwardRef(Component) as <M extends Menus>(p: MenuProps<M> & { ref?: Ref<MenuType> }) => JSX.Element | null
