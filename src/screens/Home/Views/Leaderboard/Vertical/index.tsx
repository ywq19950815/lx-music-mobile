import { useEffect, useRef, useState, useCallback } from 'react'
import { View } from 'react-native'
import { createStyle, toast } from '@/utils/tools'

import MusicList, { type MusicListType } from '../MusicList'
import { getLeaderboardSetting, saveLeaderboardSetting } from '@/utils/data'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import HeaderBar, { type HeaderBarType, type HeaderBarProps } from './HeaderBar'
import BoardsList, { type BoardsListType, type BoardsListProps } from '../BoardsList'
import BoardGallery, { type BoardGalleryType } from './BoardGallery'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { getBoardsList } from '@/core/leaderboard'
import { handleCollect, handlePlay } from '../listAction'
import boardState, { type BoardItem } from '@/store/leaderboard/state'
import { setNavActiveId } from '@/core/common'
import { openSearchOverlay } from '@/core/searchOverlay'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import SwipeBackView from '@/components/common/SwipeBackView'

export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const musicListRef = useRef<MusicListType>(null)
  const boardGalleryRef = useRef<BoardGalleryType>(null)
  const isUnmountedRef = useRef(false)
  const boardsListRef = useRef<BoardsListType>(null)
  const headerBarRef = useRef<HeaderBarType>(null)
  const boundInfo = useRef<{ source: LX.OnlineSource, id: string | null }>({ source: 'kw', id: null })
  const [currentSource, setCurrentSource] = useState<LX.OnlineSource>('kw')

  // 视图状态：默认 false 展示大三联复合卡片流；true 展示某个榜单的歌曲详情
  const [isDetailView, setIsDetailView] = useState(false)
  const isDetailViewRef = useRef(false)
  isDetailViewRef.current = isDetailView
  const [boards, setBoards] = useState<BoardItem[]>([])
  const [activeBoardId, setActiveBoardId] = useState<string>('')
  const [boardsLoading, setBoardsLoading] = useState(true)
  const [boardsError, setBoardsError] = useState(false)

  // 拉取榜单列表（带加载/失败状态）
  const loadBoards = useCallback((source: LX.OnlineSource, after?: (list: BoardItem[]) => void) => {
    setBoardsLoading(true)
    setBoardsError(false)
    void getBoardsList(source).then(list => {
      setBoards(list)
      setBoardsLoading(false)
      after?.(list)
    }).catch(() => {
      setBoardsLoading(false)
      setBoardsError(true)
    })
  }, [])

  // 重试（失败态点击）
  const handleRetryBoards = useCallback(() => {
    loadBoards(boundInfo.current.source)
  }, [loadBoards])

  const handleBoundChange = (source: LX.OnlineSource, id: string) => {
    setActiveBoardId(id)
    musicListRef.current?.loadList(source, id)
    void saveLeaderboardSetting({
      source,
      boardId: id,
    })
  }

  const onBoundChange: BoardsListProps['onBoundChange'] = (id) => {
    boundInfo.current.id = id
    setActiveBoardId(id)
    loadBoards(boundInfo.current.source, (list) => {
      requestAnimationFrame(() => {
        const bound = list.find(l => l.id == id)
        headerBarRef.current?.setBound(boundInfo.current.source, id, bound?.name ?? 'Unknown')
      })
    })
    setIsDetailView(true)
    requestAnimationFrame(() => {
      handleBoundChange(boundInfo.current.source, id)
      drawer.current?.closeDrawer()
    })
  }

  // 大三联卡片被点击
  const handleSelectBoardFromGallery = useCallback((board: BoardItem) => {
    boundInfo.current.id = board.id
    setActiveBoardId(board.id)
    headerBarRef.current?.setBound(boundInfo.current.source, board.id, board.name ?? 'Unknown')
    void saveLeaderboardSetting({
      source: boundInfo.current.source,
      boardId: board.id,
    })
    setIsDetailView(true)
    requestAnimationFrame(() => {
      musicListRef.current?.loadList(boundInfo.current.source, board.id)
    })
  }, [])

  // 从单榜单歌曲详情返回排行榜大厅
  const handleBackToGallery = useCallback(() => {
    setIsDetailView(false)
  }, [])

  // 页头搜索圆钮：打开独立搜索页（矩形为圆钮屏幕坐标，用于圆钮→搜索框的 Q 弹形变）
  const handleGoSearch = useCallback((rect: { x: number, y: number, width: number, height: number }) => {
    openSearchOverlay(rect)
  }, [])

  // 榜单大卡「播放全部」
  const handlePlayBoard = useCallback((board: BoardItem) => {
    void handlePlay(board.id)
  }, [])

  // 监听 Android 侧滑返回：若处于单榜歌曲流内页，则返回大三联画廊
  useBackHandler(useCallback(() => {
    if (commonState.navActiveId !== 'nav_top') return false
    if (isDetailViewRef.current) {
      handleBackToGallery()
      return true
    }
    return false
  }, [handleBackToGallery]))

  useEffect(() => {
    const handleHomeBack = (callback: (consumed: boolean) => void) => {
      if (commonState.navActiveId !== 'nav_top') return
      if (isDetailViewRef.current) {
        handleBackToGallery()
        callback(true)
      }
    }
    global.app_event.on('homeBackPress', handleHomeBack)
    return () => {
      global.app_event.off('homeBackPress', handleHomeBack)
    }
  }, [handleBackToGallery])

  const onPlay: BoardsListProps['onPlay'] = (id) => {
    boundInfo.current.id = id
    void handlePlay(id, boardState.listDetailInfo.list)
  }

  const onCollect: BoardsListProps['onCollect'] = (id, name) => {
    boundInfo.current.id = id
    void handleCollect(id, name, boundInfo.current.source)
  }

  const onShowBound = () => {
    loadBoards(boundInfo.current.source, (list) => {
      boardsListRef.current?.setList(list, boundInfo.current.id || list[0]?.id)
      requestAnimationFrame(() => {
        drawer.current?.openDrawer()
      })
    })
  }

  const onSourceChange: HeaderBarProps['onSourceChange'] = (source) => {
    boundInfo.current.source = source
    setCurrentSource(source)
    loadBoards(source, (list) => {
      const id = list[0].id
      const name = list[0].name
      setActiveBoardId(id)
      requestAnimationFrame(() => {
        boardsListRef.current?.setList(list, id)
        headerBarRef.current?.setBound(source, id, name ?? 'Unknown')
        requestAnimationFrame(() => {
          handleBoundChange(source, id)
        })
      })
    })
  }

  const navigationView = () => {
    return (
      <BoardsList
        ref={boardsListRef}
        onBoundChange={onBoundChange}
        onCollect={onCollect}
        onPlay={onPlay}
      />
    )
  }

  useEffect(() => {
    const handleFixDrawer = (id: CommonState['navActiveId']) => {
      if (id == 'nav_top') drawer.current?.fixWidth()
    }
    global.state_event.on('navActiveIdUpdated', handleFixDrawer)

    isUnmountedRef.current = false
    void getLeaderboardSetting().then(({ source, boardId }) => {
      boundInfo.current.source = source
      boundInfo.current.id = boardId
      setCurrentSource(source)
      setActiveBoardId(boardId)
      loadBoards(source, (list) => {
        const bound = list.find(l => l.id == boardId)
        boardsListRef.current?.setList(list, boardId)
        headerBarRef.current?.setBound(source, boardId, bound?.name ?? 'Unknown')
      })
      musicListRef.current?.loadList(source, boardId)
    })

    return () => {
      global.state_event.off('navActiveIdUpdated', handleFixDrawer)
      isUnmountedRef.current = true
    }
  }, [])

  return (
    <DrawerLayoutFixed
      ref={drawer}
      title="切换排行榜"
      renderNavigationView={navigationView}
    >
      <View style={styles.container}>
        <HeaderBar
          ref={headerBarRef}
          source={currentSource}
          onShowBound={onShowBound}
          onSourceChange={onSourceChange}
          isDetailView={isDetailView}
          onBackToGallery={handleBackToGallery}
          onGoSearch={handleGoSearch}
        />

        {isDetailView ? (
          <SwipeBackView onBack={handleBackToGallery}>
            <MusicList
              ref={musicListRef}
              source={currentSource}
              boardId={activeBoardId}
            />
          </SwipeBackView>
        ) : (
          <BoardGallery
            ref={boardGalleryRef}
            list={boards}
            activeId={activeBoardId}
            loading={boardsLoading}
            error={boardsError}
            onRetry={handleRetryBoards}
            onSelectBoard={handleSelectBoardFromGallery}
            onPlayBoard={handlePlayBoard}
          />
        )}
      </View>
    </DrawerLayoutFixed>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
    flexDirection: 'column',
  },
})
