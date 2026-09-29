import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useStatusbarHeight } from '@/store/common/hook'
import searchState, { type InitState as SearchState } from '@/store/search/state'
import { getSearchSetting, saveSearchSetting } from '@/utils/data'
import { createStyle } from '@/utils/tools'
import { addHistoryWord } from '@/core/search/search'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import { colors } from '@/theme/tokens'
import TipList, { type TipListType } from '../Search/TipList'
import List, { type ListType } from '../Search/List'
import { registerSearchOverlay, type SearchOverlayRect } from '@/core/searchOverlay'

type SearchType = SearchState['searchType']

interface MorphPair {
  from: SearchOverlayRect
  to: { x: number, y: number, width: number, height: number }
}

const PILL_HEIGHT = 40

/**
 * 独立搜索页（2026-09-29 需求：搜索从发现页独立出来）。
 * - 音乐馆圆钮 / 快捷搜索入口 → 打开本页（不再切换发现页）
 * - 圆钮位置 → 搜索框位置 iOS 弹簧形变（friction 6 / tension 170，带回弹的 Q 弹手感）
 * - 内容区延迟淡入上滑，关闭时反向收回
 * - 搜索逻辑与发现页同源：TipList 联想 + List 结果，历史词、搜索设置全部真实持久化
 */
export default () => {
  const statusBarHeight = useStatusbarHeight()
  const { width: windowWidth } = useWindowDimensions()

  const [visible, setVisible] = useState(false)
  const [morph, setMorph] = useState<MorphPair | null>(null)
  const [searchText, setSearchText] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('music')
  const [showClear, setShowClear] = useState(false)

  const progress = useRef(new Animated.Value(0)).current
  const backdropAnim = useRef(new Animated.Value(0)).current
  const contentAnim = useRef(new Animated.Value(0)).current

  const startRectRef = useRef<SearchOverlayRect | null>(null)
  const pendingKeywordRef = useRef<string | undefined>(undefined)
  const initedRef = useRef(false)
  const visibleRef = useRef(false)
  const searchInfoRef = useRef<{
    temp_source: LX.OnlineSource
    source: LX.OnlineSource | 'all'
    searchType: SearchType
  }>({ temp_source: 'kw', source: 'kw', searchType: 'music' })
  const layoutHeightRef = useRef(0)

  const pillRef = useRef<View>(null)
  const inputRef = useRef<TextInput>(null)
  const tipListRef = useRef<TipListType>(null)
  const listRef = useRef<ListType>(null)

  // ── 打开 / 关闭 ──────────────────────────────
  const open = useCallback((rect?: SearchOverlayRect, keyword?: string) => {
    startRectRef.current = rect ?? null
    pendingKeywordRef.current = keyword
    visibleRef.current = true
    setVisible(true)
  }, [])

  const close = useCallback(() => {
    if (!visibleRef.current) return
    visibleRef.current = false
    inputRef.current?.blur()
    Keyboard.dismiss()
    tipListRef.current?.hide()
    Animated.parallel([
      Animated.spring(progress, {
        toValue: 0,
        friction: 8,
        tension: 180,
        useNativeDriver: false,
      }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(contentAnim, { toValue: 0, duration: 180, useNativeDriver: false }),
    ]).start(({ finished }) => {
      if (!finished) return
      setVisible(false)
      setMorph(null)
    })
  }, [progress, backdropAnim, contentAnim])

  useEffect(() => {
    registerSearchOverlay(open)
    return () => {
      registerSearchOverlay(null)
    }
  }, [open])

  useBackHandler(useCallback(() => {
    if (!visibleRef.current) return false
    close()
    return true
  }, [close]))

  // ── 打开：先测量终点位置，再起形变动画 ──────────
  useEffect(() => {
    if (!visible) return
    progress.setValue(0)
    backdropAnim.setValue(0)
    contentAnim.setValue(0)
    const rafId = requestAnimationFrame(() => {
      pillRef.current?.measureInWindow((x, y, width, height) => {
        const fallback = {
          x: windowWidth - 64,
          y: statusBarHeight + 14,
          width: 36,
          height: 36,
        }
        setMorph({ from: startRectRef.current ?? fallback, to: { x, y, width, height } })
      })
    })
    return () => cancelAnimationFrame(rafId)
  }, [visible, progress, backdropAnim, contentAnim, statusBarHeight, windowWidth])

  // ── 形变参数就绪 → Q弹 spring 展开 + 内容淡入 ──
  useEffect(() => {
    if (!visible || !morph) return
    Animated.parallel([
      Animated.spring(progress, {
        toValue: 1,
        friction: 6,
        tension: 170,
        useNativeDriver: false,
      }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 240, useNativeDriver: false }),
      Animated.timing(contentAnim, {
        toValue: 1,
        delay: 110,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start()

    const timer = setTimeout(() => {
      const keyword = pendingKeywordRef.current
      pendingKeywordRef.current = undefined
      if (keyword) {
        handleSearchRef.current(keyword)
      } else {
        inputRef.current?.focus()
      }
    }, 420)
    return () => clearTimeout(timer)
  }, [visible, morph, progress, backdropAnim, contentAnim])

  // ── 搜索逻辑（与发现页 Search 同源）────────────
  const handleSearch = useCallback((keyword: string) => {
    inputRef.current?.blur()
    Keyboard.dismiss()
    tipListRef.current?.hide()
    setSearchText(keyword)
    setShowClear(!!keyword)
    void addHistoryWord(keyword)
    listRef.current?.loadList(keyword, searchInfoRef.current.source, searchInfoRef.current.searchType)
  }, [])

  const handleSearchRef = useRef(handleSearch)
  handleSearchRef.current = handleSearch

  // 首次打开时初始化搜索设置（与发现页一致：恢复历史搜索文本、音源、类型）
  useEffect(() => {
    if (!visible || initedRef.current) return
    initedRef.current = true
    void getSearchSetting().then((info) => {
      searchInfoRef.current.temp_source = info.temp_source
      searchInfoRef.current.source = info.source
      searchInfoRef.current.searchType = info.type
      setSearchType(info.type)
      if (searchState.searchText) {
        setSearchText(searchState.searchText)
        setShowClear(true)
        listRef.current?.loadList(searchState.searchText, searchInfoRef.current.source, info.type)
      }
    })
  }, [visible])

  const handleChangeText = useCallback((text: string) => {
    setSearchText(text)
    setShowClear(!!text)
    if (!text) return
    setTimeout(() => {
      tipListRef.current?.search(text, layoutHeightRef.current)
    }, 500)
  }, [])

  const handleClearText = useCallback(() => {
    setSearchText('')
    setShowClear(false)
    tipListRef.current?.hide()
    listRef.current?.loadList('', searchInfoRef.current.source, searchInfoRef.current.searchType)
  }, [])

  const handleInputBlur = useCallback(() => {
    tipListRef.current?.hide()
  }, [])

  const handleTypePress = useCallback((type: SearchType) => {
    if (type == searchInfoRef.current.searchType) return
    searchInfoRef.current.searchType = type
    setSearchType(type)
    void saveSearchSetting({ type })
    listRef.current?.loadList(searchState.searchText, searchInfoRef.current.source, type)
  }, [])

  const handleLayout = useCallback(({ nativeEvent }: { nativeEvent: { layout: { height: number } } }) => {
    layoutHeightRef.current = nativeEvent.layout.height
  }, [])

  // ── 形变插值（JS 驱动布局属性，spring 过冲带来 Q 弹感）──
  const pillStyle = useMemo(() => {
    if (!morph) return null
    const interp = (from: number, to: number) => progress.interpolate({
      inputRange: [0, 1],
      outputRange: [from, to],
    })
    return {
      position: 'absolute' as const,
      left: interp(morph.from.x, morph.to.x),
      top: interp(morph.from.y, morph.to.y),
      width: interp(morph.from.width, morph.to.width),
      height: interp(morph.from.height, morph.to.height),
      borderRadius: interp(morph.from.width / 2, PILL_HEIGHT / 2),
    }
  }, [morph, progress])

  const backBtnStyle = useMemo(() => ({
    opacity: progress.interpolate({
      inputRange: [0.5, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
  }), [progress])

  const contentStyle = useMemo(() => ({
    opacity: contentAnim,
    transform: [{
      translateY: contentAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [18, 0],
      }),
    }],
  }), [contentAnim])

  if (!visible) return null

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />

      {/* 返回按钮 */}
      <Animated.View style={[styles.backBtn, { top: statusBarHeight + 13 }, backBtnStyle]}>
        <TouchableOpacity style={styles.backBtnHit} activeOpacity={0.7} onPress={close}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </TouchableOpacity>
      </Animated.View>

      {/* 形变搜索框（圆钮 → 搜索框） */}
      <Animated.View ref={pillRef} style={[styles.pill, pillStyle]}>
        <View style={styles.pillInner}>
          <Icon name="search-2" size={15} color={colors.inkTertiary} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={searchText}
            placeholder="搜索单曲、歌手、专辑..."
            placeholderTextColor={colors.inkTertiary}
            returnKeyType="search"
            onChangeText={handleChangeText}
            onSubmitEditing={({ nativeEvent }) => { handleSearch(nativeEvent.text.trim()) }}
            onBlur={handleInputBlur}
          />
          {
            showClear ? (
              <TouchableOpacity style={styles.clearBtn} activeOpacity={0.7} onPress={handleClearText}>
                <Text style={styles.clearText}>×</Text>
              </TouchableOpacity>
            ) : null
          }
        </View>
      </Animated.View>

      {/* 内容区：类型切换 + 联想 + 结果 */}
      <Animated.View style={[styles.content, { paddingTop: statusBarHeight + PILL_HEIGHT + 18 }, contentStyle]}>
        <View style={styles.typeRow}>
          {
            ([
              { id: 'music', label: '歌曲' },
              { id: 'songlist', label: '歌单' },
            ] as const).map(({ id, label }) => {
              const isActive = searchType == id
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.typeTab, isActive && styles.typeTabActive]}
                  activeOpacity={0.7}
                  onPress={() => { handleTypePress(id) }}
                >
                  <Text style={[styles.typeText, isActive && styles.typeTextActive]}>{label}</Text>
                </TouchableOpacity>
              )
            })
          }
        </View>
        <View style={styles.listWrap} onLayout={handleLayout}>
          <TipList ref={tipListRef} onSearch={handleSearch} />
          <List ref={listRef} onSearch={handleSearch} />
        </View>
      </Animated.View>
    </View>
  )
}

const styles = createStyle({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.canvas,
  },
  backBtn: {
    position: 'absolute',
    left: 14,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnHit: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pill: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    shadowColor: 'rgba(15, 23, 42, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  pillInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink,
    height: '100%',
    padding: 0,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 14,
    lineHeight: 16,
    color: colors.inkSecondary,
    marginTop: -1,
  },
  content: {
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  typeTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.muted,
  },
  typeTabActive: {
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
  },
  typeText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.inkSecondary,
  },
  typeTextActive: {
    color: colors.brand,
    fontWeight: '700',
  },
  listWrap: {
    flex: 1,
    minHeight: 0,
  },
})
