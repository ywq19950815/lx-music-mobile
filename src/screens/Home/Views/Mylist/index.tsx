import { useEffect, useRef, useState, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import MusicList from './MusicList'
import MyList from './MyList'
import Dashboard from './Dashboard'
import ListNameEdit, { type ListNameEditType } from './MyList/ListNameEdit'
import ListImportExport, { type ListImportExportType } from './MyList/ListImportExport'
import ListMenu, { type ListMenuType } from './MyList/ListMenu'
import { handleRemove, handleSync } from './MyList/listAction'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import type { InitState as CommonState } from '@/store/common/state'

export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const [isDetailView, setIsDetailView] = useState(false)

  // 弹窗引用
  const listNameEditRef = useRef<ListNameEditType>(null)
  const listImportExportRef = useRef<ListImportExportType>(null)
  const listMenuRef = useRef<ListMenuType>(null)

  useEffect(() => {
    const handleFixDrawer = (id: CommonState['navActiveId']) => {
      if (id == 'nav_love') drawer.current?.fixWidth()
    }
    const changeVisible = (visible: boolean) => {
      if (visible) {
        requestAnimationFrame(() => {
          drawer.current?.openDrawer()
        })
      } else {
        drawer.current?.closeDrawer()
      }
    }

    global.state_event.on('navActiveIdUpdated', handleFixDrawer)
    global.app_event.on('changeLoveListVisible', changeVisible)

    return () => {
      global.state_event.off('navActiveIdUpdated', handleFixDrawer)
      global.app_event.off('changeLoveListVisible', changeVisible)
    }
  }, [])

  // 选择歌单进入详情歌曲流
  const handleSelectList = useCallback((listId: string) => {
    setIsDetailView(true)
  }, [])

  // 返回主资产大盘
  const handleBackToDashboard = useCallback(() => {
    setIsDetailView(false)
  }, [])

  // 新建歌单
  const handleCreateList = useCallback(() => {
    listNameEditRef.current?.showCreate(0)
  }, [])

  // 导入歌单
  const handleImportList = useCallback(() => {
    listImportExportRef.current?.import({ id: 'import', name: '' }, { x: 100, y: 300, w: 100, h: 40 })
  }, [])

  // 歌单菜单
  const handleShowListMenu = useCallback((listInfo: LX.List.MyListInfo, position: { x: number, y: number, w: number, h: number }) => {
    listMenuRef.current?.show({ listInfo, index: 0 }, position)
  }, [])

  const navigationView = () => <MyList />

  return (
    <DrawerLayoutFixed
      ref={drawer}
      title="📋 我的歌单与分类"
      renderNavigationView={navigationView}
    >
      <View style={styles.container}>
        {isDetailView ? (
          <MusicList onBackToDashboard={handleBackToDashboard} />
        ) : (
          <Dashboard
            onSelectList={handleSelectList}
            onCreateList={handleCreateList}
            onImportList={handleImportList}
            onShowListMenu={handleShowListMenu}
          />
        )}
      </View>

      {/* 弹窗支持 */}
      <ListNameEdit ref={listNameEditRef} />
      <ListImportExport ref={listImportExportRef} />
      <ListMenu
        ref={listMenuRef}
        onNew={index => listNameEditRef.current?.showCreate(index)}
        onRename={info => listNameEditRef.current?.show(info)}
        onSort={() => {}}
        onDuplicateMusic={() => {}}
        onImport={(info, position) => listImportExportRef.current?.import(info, position)}
        onExport={(info, position) => listImportExportRef.current?.export(info, position)}
        onRemove={info => { handleRemove(info) }}
        onSync={info => { handleSync(info) }}
        onSelectLocalFile={(info, position) => listImportExportRef.current?.selectFile(info, position)}
      />
    </DrawerLayoutFixed>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
})
