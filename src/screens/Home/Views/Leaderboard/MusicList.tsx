import { forwardRef, useEffect, useImperativeHandle, useRef, useCallback } from 'react'
import OnlineList, { type OnlineListType, type OnlineListProps } from '@/components/OnlineList'
import { clearListDetail, getListDetail, setListDetail, setListDetailInfo } from '@/core/leaderboard'
import boardState from '@/store/leaderboard/state'
import { handlePlay } from './listAction'

export interface MusicListProps {
  source?: LX.OnlineSource
  boardId?: string
}

export interface MusicListType {
  loadList: (source: LX.OnlineSource, listId: string) => void
}

export default forwardRef<MusicListType, MusicListProps>(({ source: propSource, boardId: propBoardId }, ref) => {
  const listRef = useRef<OnlineListType>(null)
  const isUnmountedRef = useRef(false)

  const doLoadList = useCallback((source: LX.OnlineSource, id: string) => {
    if (!id) return
    const listDetailInfo = boardState.listDetailInfo
    listRef.current?.setList([])
    if (listDetailInfo.id == id && listDetailInfo.source == source && listDetailInfo.list.length) {
      requestAnimationFrame(() => {
        listRef.current?.setList(listDetailInfo.list)
        listRef.current?.setStatus(listDetailInfo.maxPage <= listDetailInfo.page ? 'end' : 'idle')
      })
    } else {
      listRef.current?.setStatus('loading')
      const page = 1
      setListDetailInfo(id, source)
      return getListDetail(id, page, false, source).then((listDetail) => {
        const result = setListDetail(listDetail, id, page)
        if (isUnmountedRef.current) return
        requestAnimationFrame(() => {
          listRef.current?.setList(result.list)
          listRef.current?.setStatus(boardState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
        })
      }).catch((error) => {
        console.warn('load leaderboard detail error:', error)
        if (boardState.listDetailInfo.list.length && page == 1) clearListDetail()
        listRef.current?.setStatus('error')
      })
    }
  }, [])

  useImperativeHandle(ref, () => ({
    loadList: doLoadList,
  }), [doLoadList])

  useEffect(() => {
    isUnmountedRef.current = false
    if (propSource && propBoardId) {
      doLoadList(propSource, propBoardId)
    }
    return () => {
      isUnmountedRef.current = true
    }
  }, [propSource, propBoardId, doLoadList])


  const handlePlayList: OnlineListProps['onPlayList'] = (index) => {
    const listDetailInfo = boardState.listDetailInfo
    void handlePlay(listDetailInfo.id, listDetailInfo.list, index)
  }

  const handleRefresh: OnlineListProps['onRefresh'] = () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
    const currentId = boardState.listDetailInfo.id || propBoardId || ''
    const currentSource = boardState.listDetailInfo.source || propSource || 'kw'
    getListDetail(currentId, page, true, currentSource).then((listDetail) => {
      const result = setListDetail(listDetail, currentId, page)
      if (isUnmountedRef.current) return
      listRef.current?.setList(result.list)
      listRef.current?.setStatus(boardState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      if (boardState.listDetailInfo.list.length && page == 1) clearListDetail()
      listRef.current?.setStatus('error')
    })
  }

  const handleLoadMore: OnlineListProps['onLoadMore'] = () => {
    listRef.current?.setStatus('loading')
    const page = boardState.listDetailInfo.list.length ? boardState.listDetailInfo.page + 1 : 1
    const currentId = boardState.listDetailInfo.id || propBoardId || ''
    const currentSource = boardState.listDetailInfo.source || propSource || 'kw'
    getListDetail(currentId, page, false, currentSource).then((listDetail) => {
      const result = setListDetail(listDetail, currentId, page)
      if (isUnmountedRef.current) return
      listRef.current?.setList(result.list, true)
      listRef.current?.setStatus(boardState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      if (boardState.listDetailInfo.list.length && page == 1) clearListDetail()
      listRef.current?.setStatus('error')
    })
  }

  return <OnlineList
    ref={listRef}
    onPlayList={handlePlayList}
    onRefresh={handleRefresh}
    onLoadMore={handleLoadMore}
    checkHomePagerIdle
    rowType='medium'
    contentPaddingBottom={36}
   />
})

