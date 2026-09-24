/**
 * react-native-navigation (Wix RNN) web mock。
 * 模拟 registerComponent / setRoot / push / pop 的栈行为，
 * 组件通过 componentDidAppear 生命周期与 useNavigationComponentDidAppear 打通。
 */
import React, { useEffect, useState, useRef } from 'react'
import { View, Text } from 'react-native'

let idSeq = 1
const nextId = () => `component${idSeq++}`

const components = new Map() // name -> generator

// 屏幕栈：[{ key, name, componentId, passProps }]
let stackState = []
const stackListeners = new Set()
const emitStack = () => { for (const fn of stackListeners) fn(stackState) }

// appLaunched 处理器（regLaunchedEvent 会注册）
const launchedListeners = []
let launchedFired = false
// componentDidAppear 监听（useNavigationComponentDidAppear / registerComponentListener）
const componentListeners = new Map() // componentId -> Set<listener>
// screenPopped 监听
const poppedListeners = new Set()
// commandCompleted 监听（一次性）
const commandListeners = new Set()

const fireEvent = (listeners, payload) => {
  for (const fn of listeners) {
    try { fn(payload) } catch (e) { console.error('[rnn-mock] listener error', e) }
  }
}

export const Navigation = {
  registerComponent(name, generator) {
    components.set(name, generator)
  },

  events() {
    return {
      registerAppLaunchedListener(fn) {
        launchedListeners.push(fn)
        // 晚注册补发：RN 首帧早于 JS 侧注册时，保证监听器仍能收到
        if (launchedFired) setImmediate(fn)
      },
      registerScreenPoppedListener(fn) {
        poppedListeners.add(fn)
        return { remove: () => poppedListeners.delete(fn) }
      },
      registerCommandCompletedListener(fn) {
        commandListeners.add(fn)
        return { remove: () => commandListeners.delete(fn) }
      },
      registerComponentListener(listener, componentId) {
        if (!componentListeners.has(componentId)) componentListeners.set(componentId, new Set())
        const set = componentListeners.get(componentId)
        set.add(listener)
        return { remove: () => set.delete(listener) }
      },
      registerComponentDidAppearListener(fn) {
        return { remove: () => {} }
      },
      registerComponentDidDisappearListener() {
        return { remove: () => {} }
      },
      registerNavigationButtonPressedListener() {
        return { remove: () => {} }
      },
      registerModalDismissedListener() {
        return { remove: () => {} }
      },
    }
  },

  setDefaultOptions() {},
  mergeOptions() {},

  async setRoot(layout) {
    // 找到 root stack 里的第一个 component
    const name = findFirstComponentName(layout)
    if (!name) return
    const componentId = nextId()
    stackState = [{ key: 'root', name, componentId, passProps: {} }]
    emitStack()
  },

  async push(_parentId, layout) {
    const { name, passProps } = extractComponent(layout)
    const componentId = nextId()
    stackState = [...stackState, { key: `p${componentId}`, name, componentId, passProps: passProps || {} }]
    emitStack()
    setImmediate(() => {
      fireEvent(commandListeners, { commandId: `push${componentId}`, commandName: 'push', completionTime: 300 })
      // componentDidAppear
      const set = componentListeners.get(componentId)
      if (set) for (const l of set) l.componentDidAppear?.()
    })
  },

  async pop(componentId) {
    const idx = stackState.findIndex(s => s.componentId === componentId)
    if (idx <= 0) return
    stackState = stackState.slice(0, idx)
    emitStack()
    setImmediate(() => {
      fireEvent(poppedListeners, { componentId })
      fireEvent(commandListeners, { commandId: `pop${componentId}`, commandName: 'pop', completionTime: 300 })
    })
  },

  async popToRoot() {
    if (stackState.length <= 1) return
    const removed = stackState.slice(1)
    stackState = stackState.slice(0, 1)
    emitStack()
    setImmediate(() => {
      for (const s of removed) fireEvent(poppedListeners, { componentId: s.componentId })
    })
  },

  async showModal(layout) {
    return this.push(null, layout)
  },
  async dismissModal(componentId) {
    return this.pop(componentId)
  },
  async dismissAllModals() {
    return this.popToRoot()
  },

  constants() {
    return Promise.resolve({
      statusBarHeight: 24,
      navigationBarHeight: 0,
      topBarHeight: 0,
      bottomTabsHeight: 0,
      backButtonId: 'rnn-back',
      systemItemHeight: 0,
    })
  },
  async constantsAsync() { return Navigation.constants() },
}

function findFirstComponentName(layout) {
  if (!layout || typeof layout !== 'object') return null
  if (layout.component?.name) return layout.component.name
  for (const key of Object.keys(layout)) {
    const found = findFirstComponentName(layout[key])
    if (found) return found
  }
  return null
}

function extractComponent(layout) {
  if (!layout || typeof layout !== 'object') return {}
  if (layout.component) return layout.component
  for (const key of Object.keys(layout)) {
    const found = extractComponent(layout[key])
    if (found.name) return found
  }
  return {}
}

/**
 * 渲染当前栈顶组件（简化：只渲染栈顶，不做视觉过渡——
 * 过渡动画在真机/原生 RNN 中由 navigation.ts 的 animations 选项驱动）
 */
export function RNNTree() {
  const [stack, setStack] = useState(stackState)
  const launchedRef = useRef(false)
  useEffect(() => {
    stackListeners.add(setStack)
    // 首帧挂载后触发 appLaunched（对应 RNN 原生启动时序）
    if (!launchedRef.current) {
      launchedRef.current = true
      launchedFired = true
      setImmediate(() => fireEvent(launchedListeners))
    }
    return () => stackListeners.delete(setStack)
  }, [])

  const top = stack[stack.length - 1]
  if (!top) return null

  const generator = components.get(top.name)
  if (!generator) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Screen not registered: {top.name}</Text></View>
  }
  // RNN 语义：generator(props) 返回一个组件（如 inject），再以 JSX 渲染它
  const Screen = generator({ ...top.passProps, componentId: top.componentId })
  return (
    <View style={{ flex: 1 }} key={top.key}>
      <Screen />
    </View>
  )
}

export default { Navigation }
