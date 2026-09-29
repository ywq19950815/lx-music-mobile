import { useRef, useImperativeHandle, forwardRef, useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native'
import SearchTipList, { type SearchTipListProps as _SearchTipListProps, type SearchTipListType } from '@/components/SearchTipList'
import { debounce } from '@/utils'
import { searchListMusic } from './listAction'
import Button from '@/components/common/Button'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { getListMusics } from '@/core/list'
import listState from '@/store/list/state'
import { colors } from '@/theme/tokens'
import { Icon } from '@/components/common/Icon'
import { getSearchHistory, clearHistoryList, removeHistoryWord } from '@/core/search/search'
import { getList as getHotSearchList } from '@/core/hotSearch'

type SearchTipListProps = _SearchTipListProps<LX.Music.MusicInfo>
interface ListMusicSearchProps {
  onScrollToInfo: (info: LX.Music.MusicInfo) => void
  onSelectKeyword?: (keyword: string) => void
}
export const ITEM_HEIGHT = scaleSizeH(46)

export interface ListMusicSearchType {
  search: (keyword: string, height: number) => void
  hide: () => void
}

export const debounceSearchList = debounce((text: string, list: LX.List.ListMusics, callback: (list: LX.List.ListMusics) => void) => {
  callback(searchListMusic(list, text))
}, 200)

const DEFAULT_HOT_WORDS = [
  '周杰伦', '陈奕迅', '林俊杰', '薛之谦', '起风了',
  '晴天', '海阔天空', '青花瓷', '光辉岁月', '稻香',
]

/**
 * 搜索空白推荐探索面板：历史搜索 + 热门推荐 + 歌单常听歌手
 */
const SearchRecommendView = ({ onSelectKeyword }: { onSelectKeyword?: (keyword: string) => void }) => {
  const [historyList, setHistoryList] = useState<string[]>([])
  const [hotList, setHotList] = useState<string[]>(DEFAULT_HOT_WORDS)
  const [frequentSingers, setFrequentSingers] = useState<string[]>([])

  const loadHistory = useCallback(() => {
    void getSearchHistory().then(list => {
      setHistoryList(list || [])
    })
  }, [])

  const loadHot = useCallback(() => {
    void getHotSearchList('kw').then(res => {
      if (res && res.length) {
        setHotList(res.slice(0, 10))
      }
    }).catch(() => {
      setHotList(DEFAULT_HOT_WORDS)
    })
  }, [])

  // 统计当前歌单中高频歌手
  const loadSingers = useCallback(() => {
    const listId = listState.activeListId
    if (!listId) return
    void getListMusics(listId).then(musics => {
      if (!musics || !musics.length) {
        setFrequentSingers([])
        return
      }
      const map = new Map<string, number>()
      for (const m of musics) {
        if (!m.singer) continue
        const names = m.singer.split(/、|&|\/|,|\s+/).map(s => s.trim()).filter(Boolean)
        for (const n of names) {
          map.set(n, (map.get(n) || 0) + 1)
        }
      }
      const sorted = Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .map(e => e[0])
        .slice(0, 6)
      setFrequentSingers(sorted)
    })
  }, [])

  useEffect(() => {
    loadHistory()
    loadHot()
    loadSingers()
  }, [loadHistory, loadHot, loadSingers])

  const handleClearHistory = () => {
    clearHistoryList()
    setHistoryList([])
  }

  const handleRemoveHistoryItem = (index: number) => {
    removeHistoryWord(index)
    loadHistory()
  }

  return (
    <View style={recommendStyles.container}>
      <ScrollView
        style={recommendStyles.scroll}
        contentContainerStyle={recommendStyles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* 板块 1：历史搜索 */}
        {historyList.length > 0 && (
          <View style={recommendStyles.section}>
            <View style={recommendStyles.sectionHeader}>
              <View style={recommendStyles.titleRow}>
                <Icon name="music_time" size={13} color="#8A92A0" style={{ marginRight: 6 }} />
                <Text style={recommendStyles.sectionTitle}>搜索历史</Text>
              </View>
              <TouchableOpacity
                onPress={handleClearHistory}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={recommendStyles.clearBtn}
              >
                <Icon name="remove" size={13} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <View style={recommendStyles.tagWrap}>
              {historyList.map((word, idx) => (
                <TouchableOpacity
                  key={`hist_${idx}_${word}`}
                  style={recommendStyles.historyTag}
                  activeOpacity={0.7}
                  onPress={() => onSelectKeyword?.(word)}
                  onLongPress={() => handleRemoveHistoryItem(idx)}
                >
                  <Text style={recommendStyles.historyTagText} numberOfLines={1}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 板块 2：歌单常听歌手（快捷筛选当前歌单歌曲） */}
        {frequentSingers.length > 0 && (
          <View style={recommendStyles.section}>
            <View style={recommendStyles.sectionHeader}>
              <View style={recommendStyles.titleRow}>
                <Icon name="single" size={13} color={colors.brand} style={{ marginRight: 6 }} />
                <Text style={recommendStyles.sectionTitle}>本歌单常听歌手</Text>
              </View>
            </View>
            <View style={recommendStyles.tagWrap}>
              {frequentSingers.map((singer, idx) => (
                <TouchableOpacity
                  key={`singer_${idx}_${singer}`}
                  style={recommendStyles.singerTag}
                  activeOpacity={0.7}
                  onPress={() => onSelectKeyword?.(singer)}
                >
                  <Text style={recommendStyles.singerTagText} numberOfLines={1}>{singer}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 板块 3：热门搜索推荐 */}
        <View style={recommendStyles.section}>
          <View style={recommendStyles.sectionHeader}>
            <View style={recommendStyles.titleRow}>
              <Icon name="leaderboard" size={13} color="#F59E0B" style={{ marginRight: 6 }} />
              <Text style={recommendStyles.sectionTitle}>热门推荐</Text>
            </View>
          </View>
          <View style={recommendStyles.tagWrap}>
            {hotList.map((word, idx) => {
              const isTop3 = idx < 3
              return (
                <TouchableOpacity
                  key={`hot_${idx}_${word}`}
                  style={[
                    recommendStyles.hotTag,
                    isTop3 && recommendStyles.hotTagTop,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => onSelectKeyword?.(word)}
                >
                  {isTop3 && (
                    <View style={recommendStyles.topBadge}>
                      <Text style={recommendStyles.topBadgeText}>{idx + 1}</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      recommendStyles.hotTagText,
                      isTop3 && recommendStyles.hotTagTopText,
                    ]}
                    numberOfLines={1}
                  >
                    {word}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default forwardRef<ListMusicSearchType, ListMusicSearchProps>(({ onScrollToInfo, onSelectKeyword }, ref) => {
  const searchTipListRef = useRef<SearchTipListType<LX.Music.MusicInfo>>(null)
  const [visible, setVisible] = useState(false)
  const [keyword, setKeyword] = useState('')
  const visibleRef = useRef(false)
  const currentListIdRef = useRef('')
  const currentKeywordRef = useRef('')
  const pendingRef = useRef<{ keyword: string, height: number } | null>(null)

  const handleShowList = useCallback((kw: string, height: number) => {
    setKeyword(kw)
    const tipList = searchTipListRef.current
    if (!tipList) {
      pendingRef.current = { keyword: kw, height }
      return
    }
    tipList.setHeight(height)
    currentKeywordRef.current = kw
    const id = currentListIdRef.current = listState.activeListId
    if (kw) {
      void getListMusics(id).then(list => {
        debounceSearchList(kw, list, (list) => {
          if (currentListIdRef.current != id) return
          searchTipListRef.current?.setList(list)
        })
      })
    } else {
      tipList.setList([])
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    const pending = pendingRef.current
    if (!pending || !searchTipListRef.current) return
    pendingRef.current = null
    handleShowList(pending.keyword, pending.height)
  }, [visible, handleShowList])

  useImperativeHandle(ref, () => ({
    search(kw, height) {
      if (!visibleRef.current) {
        visibleRef.current = true
        setVisible(true)
      }
      handleShowList(kw, height)
    },
    hide() {
      visibleRef.current = false
      setKeyword('')
      currentKeywordRef.current = ''
      currentListIdRef.current = ''
      pendingRef.current = null
      searchTipListRef.current?.setList([])
    },
  }), [handleShowList])

  useEffect(() => {
    const updateList = (id: string) => {
      currentListIdRef.current = id
      if (!currentKeywordRef.current) return
      void getListMusics(listState.activeListId).then(list => {
        debounceSearchList(currentKeywordRef.current, list, (list) => {
          if (currentListIdRef.current != id) return
          searchTipListRef.current?.setList(list)
        })
      })
    }
    const handleChange = (ids: string[]) => {
      if (!ids.includes(listState.activeListId)) return
      updateList(listState.activeListId)
    }

    global.state_event.on('mylistToggled', updateList)
    global.app_event.on('myListMusicUpdate', handleChange)

    return () => {
      global.state_event.off('mylistToggled', updateList)
      global.app_event.off('myListMusicUpdate', handleChange)
    }
  }, [])

  const renderItem = ({ item, index }: { item: LX.Music.MusicInfo, index: number }) => {
    return (
      <Button style={styles.item} onPress={() => { onScrollToInfo(item) }} key={index}>
        <View style={styles.itemName}>
          <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
          <Text style={styles.subName} numberOfLines={1} size={12} color={colors.inkSecondary}>{item.singer} ({item.meta.albumName})</Text>
        </View>
        <Text style={styles.itemSource} size={10}>{item.source?.toUpperCase()}</Text>
      </Button>
    )
  }
  const getkey: SearchTipListProps['keyExtractor'] = item => item.id
  const getItemLayout: SearchTipListProps['getItemLayout'] = (data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }

  if (!visible) return null

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* 当搜索词为空时，展示推荐搜索面板（历史搜索+热门探索+本歌单歌手） */}
      {keyword.trim().length === 0 && (
        <SearchRecommendView onSelectKeyword={onSelectKeyword} />
      )}

      {/* 搜索结果提示浮层 */}
      <SearchTipList
        ref={searchTipListRef}
        renderItem={renderItem}
        onPressBg={() => searchTipListRef.current?.setList([])}
        keyExtractor={getkey}
        getItemLayout={getItemLayout}
      />
    </View>
  )
})

const styles = createStyle({
  item: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  itemName: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: '600',
    color: colors.ink,
  },
  subName: {
    marginTop: 2,
  },
  itemSource: {
    flexGrow: 0,
    flexShrink: 0,
    marginLeft: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    fontWeight: '600',
    color: colors.inkTertiary,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
})

const recommendStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: -0.2,
  },
  clearBtn: {
    padding: 4,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  singerTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(49, 194, 124, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(49, 194, 124, 0.25)',
  },
  singerTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  hotTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hotTagTop: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  topBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  topBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  hotTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  hotTagTopText: {
    fontWeight: '600',
    color: '#B45309',
  },
})

