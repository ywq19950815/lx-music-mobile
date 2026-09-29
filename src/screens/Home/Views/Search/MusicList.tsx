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
import { colors, radius } from '@/theme/tokens'

// export type MusicListProps = Pick<OnlineListProps,
// 'onLoadMore'
// | 'onPlayList'
// | 'onRefresh'
// >

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

  useImperativeHandle(ref, () => ({
    async loadList(text, source) {
      searchInfoRef.current.text = text
      searchInfoRef.current.source = source
      // const listDetailInfo = searchMusicState.listDetailInfo
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
          // const result = setListInfo(listDetail, id, page)
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
      // const result = setListInfo(listDetail, searchMusicState.listDetailInfo.id, page)
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
      // const result = setListInfo(listDetail, searchMusicState.listDetailInfo.id, page)
      if (isUnmountedRef.current) return
      applyList(list, true, searchInfoRef.current.source == 'all')
      listRef.current?.setStatus(info.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      listRef.current?.setStatus('error')
    })
  }

  // 列表头部：播放全部（搜索有结果时才出现）
  const header = useMemo(() => (
    listCount
      ? (
          <View style={styles.headerBox}>
            <TouchableOpacity style={styles.playAllBtn} activeOpacity={0.82} onPress={handlePlayAll}>
              <Icon name="play" size={13} color="#FFFFFF" />
              <Text style={styles.playAllText}>{t('play_all')} ({listCount})</Text>
            </TouchableOpacity>
          </View>
        )
      : null
  ), [listCount, handlePlayAll, t])

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
  headerBox: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 10,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    height: 34,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  playAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
