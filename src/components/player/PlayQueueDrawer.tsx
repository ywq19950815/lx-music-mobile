import React, { memo, useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle, useRef } from 'react'
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { playList, playNext } from '@/core/player/player'
import { removeTempPlayList, clearTempPlayeList } from '@/core/player/tempPlayList'
import playerState from '@/store/player/state'
import listState from '@/store/list/state'
import { LIST_IDS, MUSIC_TOGGLE_MODE, MUSIC_TOGGLE_MODE_LIST } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { radius } from '@/theme/tokens'
import { toast } from '@/utils/tools'
import { useI18n } from '@/lang'
import { getListMusics, getListMusicSync } from '@/utils/listManage'

export interface PlayQueueDrawerType {
  show: () => void
  hide: () => void
}

/**
 * QQ 音乐级暗色沉浸播放队列抽屉
 * - 顶部：标题 + 曲目总数 + 播放模式切换 + 清空稍后播按钮
 * - 分区 1：「稍后播放」队列（专属绿色徽标、精准逐曲插播、独立移除、一键清空）
 * - 分区 2：「当前播放列表」全部歌曲（当前唱中高亮、快速点击切歌）
 */
const PlayQueueDrawer = forwardRef<PlayQueueDrawerType, {}>((_, ref) => {
  const t = useI18n()
  const dialogRef = useRef<DialogType>(null)

  const currentMusicInfo = usePlayerMusicInfo()
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')

  const [tempList, setTempList] = useState<LX.Player.PlayMusicInfo[]>(() => [...playerState.tempPlayList])
  const [activeListId, setActiveListId] = useState<string>(() => listState.activeListId || playerState.playMusicInfo.listId || LIST_IDS.DEFAULT)
  const [musicList, setMusicList] = useState<LX.Music.MusicInfo[]>(() => listState.allMusicList.get(activeListId) || [])

  // 刷新当前稍后播放与主列表数据（支持优先读取当前播放列表、异步数据加载与单曲兜底）
  const syncData = useCallback(() => {
    setTempList([...playerState.tempPlayList])
    const currentListId = playerState.playMusicInfo.listId || listState.activeListId || LIST_IDS.DEFAULT
    setActiveListId(currentListId)
    const syncList = getListMusicSync(currentListId)
    if (syncList && syncList.length) {
      setMusicList([...syncList])
    } else {
      void getListMusics(currentListId).then(list => {
        if (list && list.length) {
          setMusicList([...list])
        } else if (playerState.playMusicInfo.musicInfo) {
          const raw = 'progress' in playerState.playMusicInfo.musicInfo
            ? playerState.playMusicInfo.musicInfo.metadata.musicInfo
            : playerState.playMusicInfo.musicInfo
          setMusicList([raw as LX.Music.MusicInfo])
        } else {
          setMusicList([])
        }
      }).catch(() => {
        if (playerState.playMusicInfo.musicInfo) {
          const raw = 'progress' in playerState.playMusicInfo.musicInfo
            ? playerState.playMusicInfo.musicInfo.metadata.musicInfo
            : playerState.playMusicInfo.musicInfo
          setMusicList([raw as LX.Music.MusicInfo])
        }
      })
    }
  }, [])

  const show = useCallback(() => {
    syncData()
    dialogRef.current?.setVisible(true)
  }, [syncData])

  const hide = useCallback(() => {
    dialogRef.current?.setVisible(false)
  }, [])

  useImperativeHandle(ref, () => ({
    show,
    hide,
  }))

  useEffect(() => {
    syncData()
    const handleTempChange = () => setTempList([...playerState.tempPlayList])
    const handleListChange = () => syncData()

    global.state_event.on('playTempPlayListChanged', handleTempChange)
    global.app_event.on('myListMusicUpdate', handleListChange)
    global.state_event.on('playMusicInfoChanged', handleListChange)
    global.app_event.on('musicToggled', handleListChange)

    const handleGlobalOpen = () => {
      show()
    }
    global.app_event.on('openPlayQueue', handleGlobalOpen)

    return () => {
      global.state_event.off('playTempPlayListChanged', handleTempChange)
      global.app_event.off('myListMusicUpdate', handleListChange)
      global.state_event.off('playMusicInfoChanged', handleListChange)
      global.app_event.off('musicToggled', handleListChange)
      global.app_event.off('openPlayQueue', handleGlobalOpen)
    }
  }, [syncData, show])

  // 切换播放模式
  const handleTogglePlayMode = () => {
    let index = MUSIC_TOGGLE_MODE_LIST.indexOf(togglePlayMethod)
    if (++index >= MUSIC_TOGGLE_MODE_LIST.length) index = 0
    const mode = MUSIC_TOGGLE_MODE_LIST[index]
    updateSetting({ 'player.togglePlayMethod': mode })
    let modeName: 'play_list_loop' | 'play_list_random' | 'play_list_order' | 'play_single_loop' | 'play_single'
    switch (mode) {
      case MUSIC_TOGGLE_MODE.listLoop: modeName = 'play_list_loop'; break
      case MUSIC_TOGGLE_MODE.random: modeName = 'play_list_random'; break
      case MUSIC_TOGGLE_MODE.list: modeName = 'play_list_order'; break
      case MUSIC_TOGGLE_MODE.singleLoop: modeName = 'play_single_loop'; break
      default: modeName = 'play_single'; break
    }
    toast(t(modeName))
  }

  const playModeMeta = useMemo(() => {
    switch (togglePlayMethod) {
      case MUSIC_TOGGLE_MODE.listLoop:
        return { icon: 'list-loop', label: '列表循环' }
      case MUSIC_TOGGLE_MODE.random:
        return { icon: 'list-random', label: '随机播放' }
      case MUSIC_TOGGLE_MODE.list:
        return { icon: 'list-order', label: '顺序播放' }
      case MUSIC_TOGGLE_MODE.singleLoop:
        return { icon: 'single-loop', label: '单曲循环' }
      default:
        return { icon: 'single', label: '单曲播放' }
    }
  }, [togglePlayMethod])

  // 播放稍后播放列表中的特定曲目
  const handlePlayTempItem = (index: number) => {
    if (index === 0) {
      void playNext()
    } else {
      const target = tempList[index]
      removeTempPlayList(index)
      playerState.tempPlayList.unshift(target)
      void playNext()
    }
  }

  // 播放当前列表中的特定曲目
  const handlePlayListItem = (index: number) => {
    void playList(activeListId, index)
  }

  // 清空稍后播放列表
  const handleClearTemp = () => {
    clearTempPlayeList()
    toast('已清空稍后播放队列')
  }

  // 构建展示队列
  type RowItem =
    | { type: 'header'; key: string; title: string; count: number; onClear?: () => void }
    | {
        type: 'song'
        key: string
        id: string
        title: string
        singer: string
        isTemp: boolean
        isActive: boolean
        tag?: string
        onPress: () => void
        onRemove?: () => void
      }

  const rows = useMemo(() => {
    const list: RowItem[] = []
    const currentId = currentMusicInfo.id

    if (tempList.length > 0) {
      list.push({
        type: 'header',
        key: 'header-temp',
        title: '稍后播放',
        count: tempList.length,
        onClear: handleClearTemp,
      })
      tempList.forEach((item, index) => {
        const minfo = item.musicInfo as any
        if (!minfo) return
        list.push({
          type: 'song',
          key: `temp-${index}-${minfo.id}`,
          id: minfo.id,
          title: minfo.name ?? '',
          singer: minfo.singer || '未知歌手',
          isTemp: true,
          isActive: minfo.id === currentId,
          tag: index === 0 ? '下首播' : `稍后 ${index + 1}`,
          onPress: () => handlePlayTempItem(index),
          onRemove: () => removeTempPlayList(index),
        })
      })
    }

    list.push({
      type: 'header',
      key: 'header-main',
      title: '当前播放列表',
      count: musicList.length,
    })

    musicList.forEach((item, index) => {
      list.push({
        type: 'song',
        key: `main-${index}-${item.id}`,
        id: item.id,
        title: item.name,
        singer: item.singer || '未知歌手',
        isTemp: false,
        isActive: item.id === currentId,
        onPress: () => handlePlayListItem(index),
      })
    })

    return list
  }, [tempList, musicList, currentMusicInfo.id, activeListId])

  const totalCount = tempList.length + musicList.length

  return (
    <Dialog ref={dialogRef} theme="dark" title="播放队列" height="68%">
      <View style={styles.container}>
        {/* 控制辅助栏：播放模式切换 + 总曲目计数 */}
        <View style={styles.subBar}>
          <TouchableOpacity
            style={styles.modeBtn}
            activeOpacity={0.7}
            onPress={handleTogglePlayMode}
          >
            <Icon name={playModeMeta.icon} size={15} color="#A0A5B1" />
            <Text style={styles.modeText}>{playModeMeta.label}</Text>
          </TouchableOpacity>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>共 {totalCount} 首</Text>
          </View>
        </View>

        {/* 队列列表 */}
        <FlatList
          data={rows}
          keyExtractor={item => item.key}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="logo" size={32} color="rgba(255,255,255,0.18)" />
              <Text style={styles.emptyText}>播放队列为空</Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <Text style={styles.sectionTitle}>{item.title}</Text>
                    <Text style={styles.sectionCount}>({item.count})</Text>
                  </View>
                  {item.onClear ? (
                    <TouchableOpacity
                      style={styles.clearBtn}
                      activeOpacity={0.7}
                      onPress={item.onClear}
                    >
                      <Icon name="eraser" size={12} color="#8A909E" />
                      <Text style={styles.clearBtnText}>清空</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )
            }

            return (
              <View style={[styles.songRow, item.isActive && styles.songRowActive]}>
                <TouchableOpacity
                  style={styles.songMain}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                >
                  {item.isActive ? (
                    <View style={styles.activeIconBox}>
                      <Icon name="play" size={12} color="#10B981" />
                    </View>
                  ) : null}

                  {item.tag ? (
                    <View style={styles.tempBadge}>
                      <Text style={styles.tempBadgeText}>{item.tag}</Text>
                    </View>
                  ) : null}

                  <View style={styles.songMeta}>
                    <Text
                      style={[styles.songTitle, item.isActive && styles.songTitleActive]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.songSinger} numberOfLines={1}>
                      {item.singer}
                    </Text>
                  </View>
                </TouchableOpacity>

                {item.onRemove ? (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    activeOpacity={0.6}
                    onPress={item.onRemove}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="close" size={13} color="#7A808E" />
                  </TouchableOpacity>
                ) : null}
              </View>
            )
          }}
        />
      </View>
    </Dialog>
  )
})

export default memo(PlayQueueDrawer)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 6,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  modeText: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A0A5B1',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#717684',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#8A909E',
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    marginVertical: 1.5,
  },
  songRowActive: {
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
  },
  songMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeIconBox: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempBadge: {
    backgroundColor: 'rgba(49, 194, 124, 0.18)',
    borderWidth: 0.5,
    borderColor: 'rgba(49, 194, 124, 0.45)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  tempBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  songMeta: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
  },
  songTitleActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  songSinger: {
    fontSize: 11.5,
    color: '#787E8C',
  },
  removeBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#656A76',
  },
})
