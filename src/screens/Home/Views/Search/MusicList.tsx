import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import OnlineList, { type OnlineListType, type OnlineListProps } from '@/components/OnlineList'
import { search } from '@/core/search/music'
import searchMusicState, { type Source } from '@/store/search/music/state'
import { setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { createStyle, toast } from '@/utils/tools'
import { colors } from '@/theme/tokens'

export interface MusicListType {
  loadList: (text: string, source: Source) => void
}

export default forwardRef<MusicListType, {}>((props, ref) => {
  const listRef = useRef<OnlineListType>(null)
  const searchInfoRef = useRef<{ text: string, source: Source }>({ text: '', source: 'kw' })
  const isUnmountedRef = useRef(false)
  const [listCount, setListCount] = useState(0)
  const t = useI18n()

  /**
   * 统一落列表 + 同步「播放全部」计数。
   * 计数以搜索 state 中的全量列表为准（分页加载后自动累加）。
   */
  const applyList = useCallback((list: LX.Music.MusicInfoOnline[], isAppend: boolean, showSource: boolean) => {
    listRef.current?.setList(list, isAppend, showSource)
    if (isUnmountedRef.current) return
    const info = searchMusicState.listInfos[searchInfoRef.current.source]
    setListCount(info?.list.length ?? list.length)
  }, [])

  const handlePlayAll = useCallback(() => {
    const list = searchMusicState.listInfos[searchInfoRef.current.source]?.list ?? []
    if (!list.length) {
      toast('暂无可播放的歌曲')
      return
    }
    const listId = `search__${searchInfoRef.current.text || '未知关键词'}`
    void setTempList(listId, [...list]).then(() => {
      void playList(LIST_IDS.TEMP, 0)
    })
  }, [])

  const handleMultiSelect = useCallback(() => {
    listRef.current?.showMultiSelect()
  }, [])

  useImperativeHandle(ref, () => ({
    async loadList(text, source) {
      searchInfoRef.current.text = text
      searchInfoRef.current.source = source
      listRef.current?.setList([], false, source == 'all')
      setListCount(0)
      if (searchMusicState.searchText == text && searchMusicState.source == source && searchMusicState.listInfos[searchMusicState.source]!.list.length) {
        requestAnimationFrame(() => {
          applyList(searchMusicState.listInfos[searchMusicState.source]!.list, false, source == 'all')
        })
      } else {
        listRef.current?.setStatus('loading')
        const page = 1
        searchInfoRef.current.text = text
        searchInfoRef.current.source = source
        return search(text, page, source).then((list) => {
          if (isUnmountedRef.current) return
          requestAnimationFrame(() => {
            applyList(list, false, source == 'all')
            listRef.current?.setStatus(searchMusicState.listInfos[searchMusicState.source]!.maxPage <= page ? 'end' : 'idle')
          })
        }).catch(() => {
          listRef.current?.setStatus('error')
        })
      }
    },
  }), [applyList])

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  const handleRefresh: OnlineListProps['onRefresh'] = () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
    search(searchInfoRef.current.text, page, searchInfoRef.current.source).then((list) => {
      if (isUnmountedRef.current) return
      applyList(list, false, searchInfoRef.current.source == 'all')
      listRef.current?.setStatus(searchMusicState.listInfos[searchInfoRef.current.source]!.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      listRef.current?.setStatus('error')
    })
  }

  const handleLoadMore: OnlineListProps['onLoadMore'] = () => {
    listRef.current?.setStatus('loading')
    const info = searchMusicState.listInfos[searchInfoRef.current.source]!
    const page = info?.list.length ? info.page + 1 : 1
    search(searchInfoRef.current.text, page, searchInfoRef.current.source).then((list) => {
      if (isUnmountedRef.current) return
      applyList(list, true, searchInfoRef.current.source == 'all')
      listRef.current?.setStatus(info.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      listRef.current?.setStatus('error')
    })
  }

  // 对标 QQ 音乐：通栏高质感操作工具栏（左侧实心 QQ 绿播放微徽章 + 加粗播放全部 + 歌曲总数，右侧多选操作）
  const header = useMemo(() => (
    listCount
      ? (
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.playAllGroup} activeOpacity={0.72} onPress={handlePlayAll}>
              <View style={styles.playBadge}>
                <Icon name="play" size={11} color="#FFFFFF" style={styles.playBadgeIcon} />
              </View>
              <Text style={styles.playAllTitle}>{t('play_all')}</Text>
              <Text style={styles.countText}>{`(共 ${listCount} 首)`}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.multiSelectBtn} activeOpacity={0.72} onPress={handleMultiSelect}>
              <Icon name="checkbox-marked" size={13} color={colors.inkSecondary} />
              <Text style={styles.multiSelectText}>多选</Text>
            </TouchableOpacity>
          </View>
        )
      : null
  ), [listCount, handlePlayAll, handleMultiSelect, t])

  return <OnlineList
    ref={listRef}
    onRefresh={handleRefresh}
    onLoadMore={handleLoadMore}
    ListHeaderComponent={header}
    checkHomePagerIdle
    contentPaddingBottom={90}
  />
})

const styles = createStyle({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  playAllGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.24,
    shadowRadius: 4,
    elevation: 2,
  },
  playBadgeIcon: {
    marginLeft: 1.5,
  },
  playAllTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.ink,
  },
  countText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.inkTertiary,
    marginLeft: 5,
  },
  multiSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  multiSelectText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.inkSecondary,
  },
})
