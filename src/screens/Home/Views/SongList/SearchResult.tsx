import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react'
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Songlist, { type SonglistProps, type SonglistType } from './components/Songlist'
import { search } from '@/core/search/songlist'
import searchSonglistState, { type Source } from '@/store/search/songlist/state'
import { colors } from '@/theme/tokens'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'

const HOT_SONGLIST_TAGS = [
  '华语经典',
  '欧美流行',
  '车载无损',
  '治愈轻音乐',
  '民谣吉他',
  '粤语老歌',
  'ACG二次元',
  '熬夜工作',
  '睡眠助眠',
  '经典摇滚',
  '说唱嘻哈',
  '国风古风',
  '90年代回忆',
  '跑步健身',
]

export interface SearchResultProps {
  keyword: string
  source: Source
  onSelectKeyword: (kw: string) => void
  onSourceChange: (source: Source) => void
}

export interface SearchResultType {
  loadList: (text: string, source: Source) => void
}

export default forwardRef<SearchResultType, SearchResultProps>(({
  keyword,
  source,
  onSelectKeyword,
  onSourceChange,
}, ref) => {
  const listRef = useRef<SonglistType>(null)
  const isUnmountedRef = useRef(false)
  const [currentSource, setCurrentSource] = useState<Source>(source)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const currentTextRef = useRef(keyword)
  const currentSourceRef = useRef(source)
  const sourceNameType = useSettingValue('common.sourceNameType')
  const t = useI18n()

  currentTextRef.current = keyword
  currentSourceRef.current = currentSource

  const availableSources = searchSonglistState.sources

  const doSearch = useCallback(async(text: string, src: Source) => {
    if (!text.trim()) {
      setHasSearched(false)
      listRef.current?.setList([], src === 'all')
      return
    }
    setHasSearched(true)
    setLoading(true)
    listRef.current?.setStatus('loading')
    const page = 1
    try {
      const list = await search(text, page, src)
      if (isUnmountedRef.current) return
      setLoading(false)
      requestAnimationFrame(() => {
        listRef.current?.setList(list, src === 'all')
        listRef.current?.setStatus(
          searchSonglistState.maxPages[src] === page || list.length === 0 ? 'end' : 'idle',
        )
      })
    } catch {
      if (isUnmountedRef.current) return
      setLoading(false)
      listRef.current?.setStatus('error')
    }
  }, [])

  useImperativeHandle(ref, () => ({
    loadList(text, src) {
      setCurrentSource(src)
      void doSearch(text, src)
    },
  }), [doSearch])

  useEffect(() => {
    isUnmountedRef.current = false
    if (keyword) {
      void doSearch(keyword, currentSource)
    }
    return () => {
      isUnmountedRef.current = true
    }
  }, [keyword, currentSource, doSearch])

  const handleRefresh: SonglistProps['onRefresh'] = () => {
    if (!currentTextRef.current) return
    const page = 1
    listRef.current?.setStatus('refreshing')
    search(currentTextRef.current, page, currentSourceRef.current)
      .then((list) => {
        if (isUnmountedRef.current) return
        listRef.current?.setList(list, currentSourceRef.current === 'all')
        listRef.current?.setStatus(
          searchSonglistState.maxPages[currentSourceRef.current] === page ? 'end' : 'idle',
        )
      })
      .catch(() => {
        listRef.current?.setStatus('error')
      })
  }

  const handleLoadMore: SonglistProps['onLoadMore'] = () => {
    if (!currentTextRef.current) return
    listRef.current?.setStatus('loading')
    const info = searchSonglistState.listInfos[currentSourceRef.current]!
    const page = info?.list.length ? info.page + 1 : 1
    search(currentTextRef.current, page, currentSourceRef.current)
      .then((list) => {
        if (isUnmountedRef.current) return
        listRef.current?.setList(list, currentSourceRef.current === 'all')
        listRef.current?.setStatus(
          searchSonglistState.maxPages[currentSourceRef.current] === page ? 'end' : 'idle',
        )
      })
      .catch(() => {
        listRef.current?.setStatus('error')
      })
  }

  const handleSwitchSource = (src: Source) => {
    setCurrentSource(src)
    onSourceChange(src)
    if (currentTextRef.current) {
      void doSearch(currentTextRef.current, src)
    }
  }

  return (
    <View style={styles.container}>
      {/* 歌单搜索源切换栏（横向滑动微胶囊 Pills） */}
      <View style={styles.sourceBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sourceScrollContent}
        >
          {availableSources.map((src) => {
            const active = src === currentSource
            const label = t(`source_${sourceNameType}_${src}`)
            return (
              <TouchableOpacity
                key={src}
                style={[styles.sourcePill, active && styles.sourcePillActive]}
                activeOpacity={0.7}
                onPress={() => handleSwitchSource(src)}
              >
                <Text
                  style={[styles.sourcePillText, active && styles.sourcePillTextActive]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* 搜索内容区：无输入展示精选热搜词，有输入展示搜索列表 */}
      {!keyword.trim() ? (
        <ScrollView
          style={styles.hotTagsContainer}
          contentContainerStyle={styles.hotTagsContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hotHeader}>
            <Icon name="search-2" size={14} color={colors.brand} />
            <Text style={styles.hotTitle}>热门歌单推荐</Text>
          </View>
          <View style={styles.tagWrap}>
            {HOT_SONGLIST_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tagPill}
                activeOpacity={0.7}
                onPress={() => onSelectKeyword(tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.listWrap}>
          <Songlist
            ref={listRef}
            onRefresh={handleRefresh}
            onLoadMore={handleLoadMore}
          />
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  sourceBar: {
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBEFF5',
  },
  sourceScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  sourcePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  sourcePillActive: {
    backgroundColor: colors.brand,
  },
  sourcePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  sourcePillTextActive: {
    color: '#FFFFFF',
  },
  listWrap: {
    flex: 1,
  },
  hotTagsContainer: {
    flex: 1,
    padding: 16,
  },
  hotTagsContent: {
    paddingBottom: 40,
  },
  hotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  hotTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagText: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '500',
  },
})
