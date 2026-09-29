import { useEffect, useCallback } from 'react'
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

export default ({ componentId }: { componentId: string }) => {
  const isHorizontalMode = useHorizontalMode()

  useEffect(() => {
    setComponentId(COMPONENT_IDS.playDetail, componentId)

    return () => {
      commonActions.removeComponentId(componentId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId])

  useBackHandler(useCallback(() => {
    void pop(componentId)
    globalThis.app_event?.emit('closePlayDetail')
    if (typeof window !== 'undefined' && (window as any).__lxTogglePlayDetail) {
      (window as any).__lxTogglePlayDetail(false)
    }
    return true
  }, [componentId]))

  return (
    <PageContent>
      <StatusBar barStyle="light-content" />
      {
        isHorizontalMode
          ? <Horizontal componentId={componentId} />
          : <Vertical componentId={componentId} />
      }
    </PageContent>
  )
}
