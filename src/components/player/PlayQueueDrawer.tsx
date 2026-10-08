import React, { memo, useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle, useRef } from 'react'
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
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
import { colors, radius } from '@/theme/tokens'
import { toast } from '@/utils/tools'
import { useI18n } from '@/lang'
import { getListMusics, getListMusicSync } from '@/utils/listManage'
import { clearListMusics, removeListMusics } from '@/core/list'

export interface PlayQueueDrawerType {
  show: () => void
  hide: () => void
}

/**
 * QQ 音乐式现代沉浸播放队列抽屉
 * - 纯净通透的白底卡片与优雅阴影，告别深黑死板视觉
 * - 顶部控制栏：循环模式快速切换 + 当前来源提示 + 一键清空队列
 * - 稍后播放专区（绿意胶囊、精准逐曲插播、独立移除、一键清空）
 * - 当前播放列表（唱中高亮变绿 + 动态波浪指示、秒速切歌、单曲移除）
 */
const PlayQueueDrawer = forwardRef<PlayQueueDrawerType, {}>((_, ref) => {
  const t = useI18n()
  const dialogRef = useRef<DialogType>(null)
  const flatListRef = useRef<FlatList>(null)

  const currentMusicInfo = usePlayerMusicInfo()
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')

  const [tempList, setTempList] = useState<LX.Player.PlayMusicInfo[]>(() => [...playerState.tempPlayList])
  const [activeListId, setActiveListId] = useState<string>(() => (
    playerState.playInfo.playerListId
    || playerState.playMusicInfo.listId
    || listState.activeListId
    || LIST_IDS.DEFAULT
  ))
  const [musicList, setMusicList] = useState<LX.Music.MusicInfo[]>(() => (
    listState.allMusicList.get(activeListId) || []
  ))

  // 刷新当前播放队列与稍后播数据
  const syncData = useCallback(() => {
    setTempList([...playerState.tempPlayList])
    const targetListId = playerState.playInfo.playerListId
      || playerState.playMusicInfo.listId
      || listState.activeListId
      || LIST_IDS.DEFAULT

    setActiveListId(targetListId)
    const syncList = getListMusicSync(targetListId)
    if (syncList && syncList.length) {
      setMusicList([...syncList])
    } else {
      void getListMusics(targetListId).then(list => {
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
        } else {
          setMusicList([])
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
    const handleGlobalOpen = () => {
      show()
    }

    global.state_event.on('playTempPlayListChanged', handleTempChange)
    global.app_event.on('myListMusicUpdate', handleListChange)
    global.state_event.on('playMusicInfoChanged', handleListChange)
    global.app_event.on('musicToggled', handleListChange)
    global.app_event.on('downloadListUpdate', handleListChange)
    global.app_event.on('openPlayQueue', handleGlobalOpen)

    return () => {
      global.state_event.off('playTempPlayListChanged', handleTempChange)
      global.app_event.off('myListMusicUpdate', handleListChange)
      global.state_event.off('playMusicInfoChanged', handleListChange)
      global.app_event.off('musicToggled', handleListChange)
      global.app_event.off('downloadListUpdate', handleListChange)
      global.app_event.off('openPlayQueue', handleGlobalOpen)
    }
  }, [syncData, show])

  // 当前列表来源名称
  const activeListName = useMemo(() => {
    switch (activeListId) {
      case LIST_IDS.DEFAULT:
        return '试听列表'
      case LIST_IDS.LOVE:
        return '我喜欢'
      case LIST_IDS.TEMP:
        return '临时搜索播放'
      case LIST_IDS.DOWNLOAD:
        return '本地与下载'
      default:
        return listState.allList.find(l => l.id === activeListId)?.name || '当前播放列表'
    }
  }, [activeListId])

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

  // 移除单首歌曲
  const handleRemoveItem = (id: string, isTemp: boolean, index: number) => {
    if (isTemp) {
      removeTempPlayList(index)
      toast('已移除稍后播放')
    } else {
      void removeListMusics(activeListId, [id])
      toast('已从播放队列移除')
      syncData()
    }
  }

  // 清空稍后播放列表
  const handleClearTemp = () => {
    clearTempPlayeList()
    toast('已清空稍后播放队列')
  }

  // 清空全部队列
  const handleClearAll = () => {
    Alert.alert(
      '清空播放队列',
      '确定清空当前队列全部歌曲吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: async() => {
            clearTempPlayeList()
            if (activeListId) {
              await clearListMusics([activeListId])
            }
            toast('已清空播放队列')
            syncData()
          },
        },
      ],
    )
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
          onRemove: () => handleRemoveItem(minfo.id, true, index),
        })
      })
    }

    list.push({
      type: 'header',
      key: 'header-main',
      title: activeListName,
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
        onRemove: () => handleRemoveItem(item.id, false, index),
      })
    })

    return list
  }, [tempList, musicList, currentMusicInfo.id, activeListId, activeListName])

  const totalCount = tempList.length + musicList.length

  return (
    <Dialog ref={dialogRef} title="当前播放队列" height="72%">
      <View style={styles.container}>
        {/* 控制辅助栏：播放模式切换 + 队列统计 + 一键清空 */}
        <View style={styles.subBar}>
          <TouchableOpacity
            style={styles.modeBtn}
            activeOpacity={0.7}
            onPress={handleTogglePlayMode}
          >
            <Icon name={playModeMeta.icon} size={14} color={colors.brand} />
            <Text style={styles.modeText}>{playModeMeta.label}</Text>
          </TouchableOpacity>

          <View style={styles.middleInfo}>
            <Text style={styles.totalCountText}>共 {totalCount} 首</Text>
          </View>

          {totalCount > 0 ? (
            <TouchableOpacity
              style={styles.clearAllBtn}
              activeOpacity={0.7}
              onPress={handleClearAll}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Icon name="eraser" size={13} color={colors.inkTertiary} />
              <Text style={styles.clearAllText}>清空</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 队列列表 */}
        <FlatList
          ref={flatListRef}
          data={rows}
          keyExtractor={item => item.key}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Icon name="logo" size={28} color={colors.brand} />
              </View>
              <Text style={styles.emptyTitle}>当前播放队列为空</Text>
              <Text style={styles.emptySub}>在歌曲列表中点击即可加入队列播放</Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={styles.sectionIndicator} />
                    <Text style={styles.sectionTitle}>{item.title}</Text>
                    <Text style={styles.sectionCount}>({item.count}首)</Text>
                  </View>
                  {item.onClear ? (
                    <TouchableOpacity
                      style={styles.clearBtn}
                      activeOpacity={0.7}
                      onPress={item.onClear}
                    >
                      <Icon name="close" size={11} color={colors.inkTertiary} />
                      <Text style={styles.clearBtnText}>清空稍后播</Text>
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
                      <Icon name="play" size={10} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.normalDot} />
                  )}

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

                {item.isActive ? (
                  <View style={styles.playingTag}>
                    <Text style={styles.playingTagText}>播放中</Text>
                  </View>
                ) : null}

                {item.onRemove ? (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    activeOpacity={0.6}
                    onPress={item.onRemove}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="close" size={13} color="#94A3B8" />
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
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  // 控制栏
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    marginBottom: 4,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(49, 194, 124, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  modeText: {
    fontSize: 12,
    color: colors.brand,
    fontWeight: '700',
  },
  middleInfo: {
    flex: 1,
    alignItems: 'center',
  },
  totalCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#F1F5F9',
  },
  clearAllText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.inkSecondary,
  },

  // 列表
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 6,
    paddingHorizontal: 2,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionIndicator: {
    width: 3,
    height: 12,
    borderRadius: 1.5,
    backgroundColor: colors.brand,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.ink,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.inkTertiary,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: '#F1F5F9',
  },
  clearBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.inkSecondary,
  },

  // 歌曲行
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginVertical: 2,
    backgroundColor: '#FFFFFF',
  },
  songRowActive: {
    backgroundColor: 'rgba(49, 194, 124, 0.08)',
  },
  songMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeIconBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  normalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginLeft: 6,
    marginRight: 6,
  },
  tempBadge: {
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(49, 194, 124, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tempBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.brand,
  },
  songMeta: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: colors.ink,
  },
  songTitleActive: {
    color: colors.brand,
    fontWeight: '700',
  },
  songSinger: {
    fontSize: 11,
    color: colors.inkTertiary,
  },
  playingTag: {
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  playingTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.brand,
  },
  removeBtn: {
    padding: 6,
  },

  // 空态
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(49, 194, 124, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  emptySub: {
    fontSize: 12,
    color: colors.inkTertiary,
  },
})
