import { useEffect, useRef, useCallback } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import PageContent from '@/components/PageContent'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
import { navigations } from '@/navigation'
import settingState from '@/store/setting/state'
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
    // 子页面（歌单/评论/设置/播放页）在栈上时，HOME 被覆盖 → 返回 false 让 RNN 自动 pop 子页面
    if (!isVisibleRef.current) return false

    // 首页栈顶：双击退出，避免误触直接退出到桌面
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
