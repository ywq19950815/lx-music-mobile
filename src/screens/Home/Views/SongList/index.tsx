import { useEffect, useRef } from 'react'
import Content from './Content'
import TagList from './TagList'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import type { InitState as CommonState } from '@/store/common/state'

export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)

  useEffect(() => {
    const handleFixDrawer = (id: CommonState['navActiveId']) => {
      if (id == 'nav_songlist') drawer.current?.fixWidth()
    }
    const handleShow = () => {
      requestAnimationFrame(() => {
        drawer.current?.openDrawer()
      })
    }
    const handleHide = () => {
      drawer.current?.closeDrawer()
    }

    const handleHomeBack = (callback: (consumed: boolean) => void) => {
      if (commonState.navActiveId !== 'nav_songlist') return
      if (drawer.current?.isOpen) {
        drawer.current.closeDrawer()
        callback(true)
      }
    }

    global.state_event.on('navActiveIdUpdated', handleFixDrawer)
    global.app_event.on('showSonglistTagList', handleShow)
    global.app_event.on('hideSonglistTagList', handleHide)
    global.app_event.on('homeBackPress', handleHomeBack)

    return () => {
      global.state_event.off('navActiveIdUpdated', handleFixDrawer)
      global.app_event.off('showSonglistTagList', handleShow)
      global.app_event.off('hideSonglistTagList', handleHide)
      global.app_event.off('homeBackPress', handleHomeBack)
    }
  }, [])

  const navigationView = () => <TagList />

  return (
    <DrawerLayoutFixed
      ref={drawer}
      title="歌单分类标签"
      renderNavigationView={navigationView}
    >
      <Content />
    </DrawerLayoutFixed>
  )
}
