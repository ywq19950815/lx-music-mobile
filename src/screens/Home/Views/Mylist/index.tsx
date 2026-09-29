import { useEffect, useRef, useState, useCallback } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { colors } from '@/theme/tokens'
import MusicList from './MusicList'
import MyList from './MyList'
import Dashboard from './Dashboard'
import Setting from '../Setting'
import ListNameEdit, { type ListNameEditType } from './MyList/ListNameEdit'
import ListImportExport, { type ListImportExportType } from './MyList/ListImportExport'
import ListMenu, { type ListMenuType } from './MyList/ListMenu'
import { handleRemove, handleSync } from './MyList/listAction'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { useBackHandler } from '@/utils/hooks/useBackHandler'

// 二级视图：'dashboard' 资产大盘 / 'detail' 歌单歌曲流 / 'setting' 设置（原一级 Tab 已精简移入此处）
type SubView = 'dashboard' | 'detail' | 'setting'

export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const [subView, setSubView] = useState<SubView>('dashboard')
  const subViewRef = useRef<SubView>('dashboard')
  subViewRef.current = subView

  // 弹窗引用
  const listNameEditRef = useRef<ListNameEditType>(null)
  const listImportExportRef = useRef<ListImportExportType>(null)
  const listMenuRef = useRef<ListMenuType>(null)

  // 处理 Android 侧滑返回：当处于设置或歌单二级页时，返回主资产大盘
  useBackHandler(useCallback(() => {
    if (commonState.navActiveId !== 'nav_love') return false
    if (subViewRef.current !== 'dashboard') {
      setSubView('dashboard')
      return true
    }
    return false
  }, []))

  useEffect(() => {
    const handleHomeBack = (callback: (consumed: boolean) => void) => {
      if (commonState.navActiveId !== 'nav_love') return
      if (subViewRef.current !== 'dashboard') {
        setSubView('dashboard')
        callback(true)
      }
    }
    global.app_event.on('homeBackPress', handleHomeBack)
    return () => {
      global.app_event.off('homeBackPress', handleHomeBack)
    }
  }, [])

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
    const handleOpenSettingEvent = () => {
      setSubView('setting')
    }

    global.state_event.on('navActiveIdUpdated', handleFixDrawer)
    global.app_event.on('changeLoveListVisible', changeVisible)
    global.app_event.on('openSetting', handleOpenSettingEvent)

    return () => {
      global.state_event.off('navActiveIdUpdated', handleFixDrawer)
      global.app_event.off('changeLoveListVisible', changeVisible)
      global.app_event.off('openSetting', handleOpenSettingEvent)
    }
  }, [])

  // 选择歌单进入详情歌曲流
  const handleSelectList = useCallback((listId: string) => {
    setSubView('detail')
  }, [])

  // 返回主资产大盘
  const handleBackToDashboard = useCallback(() => {
    setSubView('dashboard')
  }, [])

  // 打开设置二级菜单
  const handleOpenSetting = useCallback(() => {
    setSubView('setting')
  }, [])

  // 从设置返回
  const handleBackFromSetting = useCallback(() => {
    setSubView('dashboard')
  }, [])

  // 新建歌单
  const handleCreateList = useCallback(() => {
    listNameEditRef.current?.showCreate(0)
  }, [])

  // 导入歌单
  const handleImportList = useCallback(() => {
    listImportExportRef.current?.import({ id: 'import', name: '', locationUpdateTime: null }, 0)
  }, [])

  // 歌单菜单
  const handleShowListMenu = useCallback((listInfo: LX.List.MyListInfo, position: { x: number, y: number, w: number, h: number }) => {
    listMenuRef.current?.show({ listInfo, index: 0 }, position)
  }, [])

  const navigationView = () => <MyList />

  return (
    <DrawerLayoutFixed
      ref={drawer}
      title="我的歌单与分类"
      renderNavigationView={navigationView}
    >
      <View style={styles.container}>
        {subView === 'detail' ? (
          <MusicList onBackToDashboard={handleBackToDashboard} />
        ) : subView === 'setting' ? (
          <View style={styles.settingWrapper}>
            <View style={styles.settingNavBar}>
              <TouchableOpacity style={styles.settingBackBtn} activeOpacity={0.7} onPress={handleBackFromSetting}>
                <Icon name="chevron-left" size={18} color="#0F172A" />
              </TouchableOpacity>
              <View style={styles.settingNavCenter}>
                <Text style={styles.settingNavTitle}>应用设置</Text>
                <Text style={styles.settingNavSub}>个性化偏好 · 音频与服务配置</Text>
              </View>
              <View style={styles.settingNavRightPlaceholder} />
            </View>
            <Setting />
          </View>
        ) : (
          <Dashboard
            onSelectList={handleSelectList}
            onCreateList={handleCreateList}
            onImportList={handleImportList}
            onOpenSetting={handleOpenSetting}
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
    backgroundColor: '#F8FAFC',
  },
  settingWrapper: {
    flex: 1,
    minHeight: 0,
  },
  settingNavBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  settingBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingNavCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingNavTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingNavSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 1,
  },
  settingNavRightPlaceholder: {
    width: 36,
    height: 36,
  },
})
