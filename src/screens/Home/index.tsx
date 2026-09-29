import { useEffect, useRef, useCallback } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import PageContent from '@/components/PageContent'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
import { navigations, pop } from '@/navigation'
import settingState from '@/store/setting/state'
import commonState from '@/store/common/state'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import { Navigation } from 'react-native-navigation'
import { exitApp, toast } from '@/utils/tools'


interface Props {
  componentId: string
}


export default ({ componentId }: Props) => {
  const isHorizontalMode = useHorizontalMode()
  // HOME 是否在栈顶（无子页面压在它上面）。被覆盖时让权给 RNN 处理系统返回键。
  const isVisibleRef = useRef(true)
  // 双击退出：首次按返回提示，2 秒内再按才真正退出
  const backRef = useRef(false)
  const backTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setComponentId(COMPONENT_IDS.home, componentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps

    if (settingState.setting['player.startupPushPlayDetailScreen']) {
      // 即将把播放页压到 HOME 之上，提前标记 HOME 不可见，避免启动瞬间误判为「首页双击退出」
      isVisibleRef.current = false
      navigations.pushPlayDetailScreen(componentId, true)
    }

    // 跟踪 HOME 是否处于栈顶，避免吞掉子页面的系统返回键
    const onDisappear = Navigation.events().registerComponentDidDisappearListener(({ componentId: id }) => {
      if (id === componentId) isVisibleRef.current = false
    })
    const onAppear = Navigation.events().registerComponentDidAppearListener(({ componentId: id }) => {
      if (id === componentId) isVisibleRef.current = true
    })

    return () => {
      onDisappear.remove()
      onAppear.remove()
      if (backTimerRef.current) clearTimeout(backTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleBack = useCallback(() => {
    // 1. 深度检测：是否有原生二级子页面压在 Home 之上（SonglistDetail、Comment、PlayDetail）
    // 只要 commonState.componentIds 里有任何非 home 的组件存在，说明绝对不在首页！
    const subScreenIds = (Object.entries(commonState.componentIds) as Array<[COMPONENT_IDS, string]>)
      .filter(([name, id]) => name !== COMPONENT_IDS.home && !!id)

    if (subScreenIds.length > 0) {
      // 存在原生二级页面，获取最顶层的子页面主动 pop，绝不弹出退出提示！
      const [topName, topId] = subScreenIds[subScreenIds.length - 1]
      void pop(topId)
      if (topName === COMPONENT_IDS.playDetail) {
        global.app_event?.closePlayDetail()
        if ((globalThis as any).__lxTogglePlayDetail) {
          (globalThis as any).__lxTogglePlayDetail(false)
        }
      }
      return true
    }

    // 2. 如果 isVisibleRef 明确为 false（被其他原生层完全遮挡），直接让权给系统
    if (!isVisibleRef.current) return false

    // 3. 内部二级/三级页面与状态拦截：
    // 通过事件向当前活跃的视图派发 backPress 事件，询问是否有二级页面需要回退
    let consumedBySubView = false
    global.app_event?.homeBackPress((consumed: boolean) => {
      if (consumed) consumedBySubView = true
    })
    if (consumedBySubView) return true

    // 4. 只有当没有原生二级页面压栈、内部也没有任何子视图拦截时，才是真正的首页顶层，此时才双击退出
    if (backRef.current) {
      backRef.current = false
      exitApp()
      return true
    }
    backRef.current = true
    toast(global.i18n.t('double_click_exit_tip'))
    if (backTimerRef.current) clearTimeout(backTimerRef.current)
    backTimerRef.current = setTimeout(() => { backRef.current = false }, 2000)
    return true
  }, [componentId])

  useBackHandler(handleBack)

  return (
    <PageContent>
      {
        isHorizontalMode
          ? <Horizontal />
          : <Vertical />
      }
    </PageContent>
  )
}
