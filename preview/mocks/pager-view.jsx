/**
 * PagerView web mock：水平滑动分页（带 forwardRef 与命令式接口）。
 * 完全兼容 react-native-pager-view 的 ref.setPage / ref.setPageWithoutAnimation / ref.setScrollEnabled，
 * 彻底解决点击 Tab 导航菜单页面无法切换的问题。
 */
import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import { View } from 'react-native'

const PagerView = forwardRef(function PagerView(
  {
    style,
    initialPage = 0,
    onPageSelected,
    onPageScroll,
    onPageScrollStateChanged,
    scrollEnabled = true,
    children,
    ...rest
  },
  ref,
) {
  const [idx, setIdx] = useState(initialPage)
  const [width, setWidth] = useState(0)
  const [dx, setDx] = useState(0)
  const [canScroll, setCanScroll] = useState(scrollEnabled)
  const dragRef = useRef({ startX: null, active: false })
  const count = React.Children.count(children)
  const idxRef = useRef(idx)
  idxRef.current = idx

  useEffect(() => {
    setCanScroll(scrollEnabled)
  }, [scrollEnabled])

  const select = (next, animated = true) => {
    const clamped = Math.max(0, Math.min(count - 1, next))
    setIdx(clamped)
    setDx(0)
    onPageSelected?.({ nativeEvent: { position: clamped } })
  }

  // 暴露与原生 react-native-pager-view 100% 一致的命令式接口
  useImperativeHandle(
    ref,
    () => ({
      setPage: (selectedPage) => {
        select(selectedPage, true)
      },
      setPageWithoutAnimation: (selectedPage) => {
        select(selectedPage, false)
      },
      setScrollEnabled: (enabled) => {
        setCanScroll(enabled)
      },
    }),
    [count],
  )

  const onPointerDown = (e) => {
    if (!canScroll) return
    dragRef.current.startX = e.clientX
    dragRef.current.active = true
    onPageScrollStateChanged?.({ nativeEvent: { pageScrollState: 'dragging' } })
  }

  const onPointerMove = (e) => {
    if (!dragRef.current.active) return
    const offset = e.clientX - dragRef.current.startX
    setDx(offset)
    if (width > 0) {
      onPageScroll?.({
        nativeEvent: {
          position: idxRef.current,
          offset: -offset / width,
        },
      })
    }
  }

  const endDrag = (e) => {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    const delta = e.clientX - dragRef.current.startX
    setDx(0)
    onPageScrollStateChanged?.({ nativeEvent: { pageScrollState: 'settling' } })

    if (Math.abs(delta) > Math.max(40, width / 5)) {
      select(idxRef.current + (delta < 0 ? 1 : -1))
    }
    setTimeout(() => {
      onPageScrollStateChanged?.({ nativeEvent: { pageScrollState: 'idle' } })
    }, 50)
  }

  const webHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  }

  return (
    <View
      style={[style, { overflow: 'hidden' }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...webHandlers}
      {...rest}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          width: width * count || `${count * 100}%`,
          transform: [{ translateX: -idx * width + dx }],
          transition: dragRef.current.active ? 'none' : 'transform 0.25s ease-out',
        }}
      >
        {React.Children.map(children, (child, i) => (
          <View key={i} style={{ width: width || '100%', flex: 1, minHeight: 0 }}>
            {child}
          </View>
        ))}
      </View>
    </View>
  )
})

export default PagerView
