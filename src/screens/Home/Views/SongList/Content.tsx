import { getSongListSetting, saveSongListSetting } from '@/utils/data'
import { useEffect, useRef, useState, useCallback } from 'react'
import { StyleSheet, View } from 'react-native'

import HeaderBar, { type HeaderBarProps, type HeaderBarType } from './HeaderBar'
import songlistState, { type InitState, type SortInfo } from '@/store/songlist/state'
import type { Source as SearchSource } from '@/store/search/songlist/state'
import List, { type ListType } from './List'
import SearchBar, { type SearchBarType } from './SearchBar'
import SearchResult, { type SearchResultType } from './SearchResult'
import SwipeBackView from '@/components/common/SwipeBackView'
import commonState from '@/store/common/state'

interface SonglistInfo {
  source: InitState['sources'][number]
  sortId: SortInfo['id']
  tagId: string
}

export default () => {
  const headerBarRef = useRef<HeaderBarType>(null)
  const listRef = useRef<ListType>(null)
  const searchBarRef = useRef<SearchBarType>(null)
  const searchResultRef = useRef<SearchResultType>(null)
  const songlistInfo = useRef<SonglistInfo>({ source: 'kw', sortId: '5', tagId: '' })

  const [keyword, setKeyword] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchSource, setSearchSource] = useState<SearchSource>('kw')
  const isSearchingRef = useRef(false)
  isSearchingRef.current = isSearching

  useEffect(() => {
    void getSongListSetting().then(info => {
      songlistInfo.current.source = info.source
      songlistInfo.current.sortId = info.sortId
      songlistInfo.current.tagId = info.tagId
      setSearchSource(info.source)
      headerBarRef.current?.setSource(info.source, info.sortId, info.tagName, info.tagId)
      listRef.current?.loadList(info.source, info.sortId, info.tagId)
    })

    const handleHomeBack = (callback: (consumed: boolean) => void) => {
      if (commonState.navActiveId !== 'nav_songlist') return
      if (isSearchingRef.current) {
        setIsSearching(false)
        setKeyword('')
        callback(true)
      }
    }

    global.app_event.on('homeBackPress', handleHomeBack)

    return () => {
      global.app_event.off('homeBackPress', handleHomeBack)
    }
  }, [])

  const handleSortChange: HeaderBarProps['onSortChange'] = (id) => {
    songlistInfo.current.sortId = id
    void saveSongListSetting({ sortId: id })
    listRef.current?.loadList(songlistInfo.current.source, id, songlistInfo.current.tagId)
  }

  const handleTagChange: HeaderBarProps['onTagChange'] = (name, id) => {
    songlistInfo.current.tagId = id
    void saveSongListSetting({ tagName: name, tagId: id })
    listRef.current?.loadList(songlistInfo.current.source, songlistInfo.current.sortId, id)
  }

  const handleSourceChange: HeaderBarProps['onSourceChange'] = (source) => {
    songlistInfo.current.source = source
    songlistInfo.current.tagId = ''
    songlistInfo.current.sortId = songlistState.sortList[source]![0].id
    setSearchSource(source)
    void saveSongListSetting({ sortId: songlistInfo.current.sortId, source, tagId: '', tagName: '' })
    headerBarRef.current?.setSource(source, songlistInfo.current.sortId, '', songlistInfo.current.tagId)
    listRef.current?.loadList(source, songlistInfo.current.sortId, songlistInfo.current.tagId)
  }

  // 歌单搜索相关处理
  const handleStartSearch = useCallback((text: string) => {
    setKeyword(text)
    setIsSearching(true)
    if (text.trim()) {
      searchResultRef.current?.loadList(text.trim(), searchSource)
    }
  }, [searchSource])

  const handleCancelSearch = useCallback(() => {
    setIsSearching(false)
    setKeyword('')
  }, [])

  const handleClearKeyword = useCallback(() => {
    setKeyword('')
  }, [])

  const handleFocusSearch = useCallback(() => {
    setIsSearching(true)
  }, [])

  return (
    <View style={styles.container}>
      {/* 歌单页顶部搜索栏（只负责歌单检索） */}
      <SearchBar
        ref={searchBarRef}
        keyword={keyword}
        isSearching={isSearching}
        onChangeKeyword={setKeyword}
        onSearch={handleStartSearch}
        onClear={handleClearKeyword}
        onCancel={handleCancelSearch}
        onFocus={handleFocusSearch}
      />

      {isSearching ? (
        <SwipeBackView onBack={handleCancelSearch}>
          <SearchResult
            ref={searchResultRef}
            keyword={keyword}
            source={searchSource}
            onSelectKeyword={handleStartSearch}
            onSourceChange={setSearchSource}
          />
        </SwipeBackView>
      ) : (
        <View style={styles.contentWrap}>
          <HeaderBar
            ref={headerBarRef}
            onSortChange={handleSortChange}
            onTagChange={handleTagChange}
            onSourceChange={handleSourceChange}
          />
          <List ref={listRef} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentWrap: {
    flex: 1,
  },
})
