import { useEffect, useCallback, useContext } from 'react'
// import { View, StyleSheet } from 'react-native'
import { useHorizontalMode } from '@/utils/hooks'

import Vertical from './Vertical'
import Horizontal from './Horizontal'
import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import { pop } from '@/navigation'
import commonActions from '@/store/common/action'
import { ThemeContext } from '@/store/theme/state'

export default ({ componentId }: { componentId: string }) => {
  const isHorizontalMode = useHorizontalMode()
  const theme = useContext(ThemeContext)

  useEffect(() => {
    setComponentId(COMPONENT_IDS.playDetail, componentId)

    return () => {
      commonActions.removeComponentId(componentId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId])

  useBackHandler(useCallback(() => {
    void pop(componentId)
    global.app_event?.closePlayDetail()
    if ((globalThis as any).__lxTogglePlayDetail) {
      (globalThis as any).__lxTogglePlayDetail(false)
    }
    return true
  }, [componentId]))

  return (
    <PageContent>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      {
        isHorizontalMode
          ? <Horizontal componentId={componentId} />
          : <Vertical componentId={componentId} />
      }
    </PageContent>
  )
}
