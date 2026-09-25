import { memo, useMemo, useEffect, useRef, useCallback, useState } from 'react'
import {
  View,
  FlatList,
  type FlatListProps,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native'
import { type Line, useLrcPlay, useLrcSet } from '@/plugins/lyric'
import { useSettingValue } from '@/store/setting/hook'
import Text from '@/components/common/Text'
import { useStatusText } from '@/store/player/hook'
import { setSpText } from '@/utils/pixelRatio'
import playerState from '@/store/player/state'
import PlayLine, { type PlayLineType } from '../components/PlayLine'
import { colors as designColors } from '@/theme/tokens'

type FlatListType = FlatListProps<Line>

interface LineProps {
  line: Line
  lineNum: number
  activeLine: number
  duration: number
  lrcFontSize: number
  textAlign: any
  onLayout: (lineNum: number, height: number, width: number) => void
}

/**
 * 现代高质感歌词行组件：
 * - 激活态：双层渲染 + 逐字平滑金色填充动效 (Karaoke Effect)
 * - 非激活态：柔和微弱白色，不抢占视觉
 * - 极端性能优化：仅当前行与上一行触发重绘，丝滑不掉帧
 */
const LrcLine = memo(({
  line,
  lineNum,
  activeLine,
  duration,
  lrcFontSize,
  textAlign,
  onLayout,
}: LineProps) => {
  const active = activeLine === lineNum
  const baseSize = lrcFontSize / 10
  const size = active ? baseSize * 1.15 : baseSize
  const lineHeight = setSpText(size) * 1.4

  // 卡拉OK逐字平滑染色动画进度 (0 -> 1)
  const progressAnim = useRef(new Animated.Value(active ? 1 : 0)).current
  const [lineWidth, setLineWidth] = useState<number | null>(null)

  useEffect(() => {
    if (active) {
      progressAnim.setValue(0)
      const animDuration = Math.max(800, Math.min(duration || 3500, 9000))
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: animDuration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      }).start()
    } else {
      progressAnim.setValue(0)
    }
  }, [active, duration, progressAnim])

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    onLayout(lineNum, nativeEvent.layout.height, nativeEvent.layout.width)
  }

  const handleTextLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    if (nativeEvent.layout.width > 0 && nativeEvent.layout.width !== lineWidth) {
      setLineWidth(nativeEvent.layout.width)
    }
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View
      style={[styles.line, active ? styles.activeLineWrapper : null]}
      onLayout={handleLayout}
    >
      {active ? (
        <View style={styles.activeTextContainer}>
          {/* 底层：弱化暗底文字 */}
          <Text
            style={[
              styles.lineText,
              {
                textAlign,
                lineHeight,
                fontSize: size,
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.35)',
              },
            ]}
            onLayout={handleTextLayout}
            textBreakStrategy="simple"
          >
            {line.text}
          </Text>

          {/* 顶层：卡拉OK平滑金色染色文字，随播放进度从左至右逐字擦染 */}
          <Animated.View
            style={[
              styles.karaokeMask,
              { width: progressWidth },
            ]}
          >
            <Text
              style={[
                styles.lineText,
                {
                  textAlign,
                  lineHeight,
                  fontSize: size,
                  fontWeight: '700',
                  color: designColors.brand,
                  width: lineWidth ?? '100%',
                },
              ]}
              textBreakStrategy="simple"
            >
              {line.text}
            </Text>
          </Animated.View>

          {/* 翻译歌词 */}
          {line.extendedLyrics.map((lrc, index) => (
            <Text
              key={index}
              style={[
                styles.lineTranslationText,
                {
                  textAlign,
                  lineHeight: lineHeight * 0.8,
                  fontSize: size * 0.8,
                  fontWeight: '600',
                  color: 'rgba(245, 166, 35, 0.85)',
                },
              ]}
              textBreakStrategy="simple"
            >
              {lrc}
            </Text>
          ))}
        </View>
      ) : (
        <View style={styles.inactiveTextContainer}>
          <Text
            style={[
              styles.lineText,
              {
                textAlign,
                lineHeight,
                fontSize: size,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.55)',
              },
            ]}
            textBreakStrategy="simple"
          >
            {line.text}
          </Text>
          {line.extendedLyrics.map((lrc, index) => (
            <Text
              key={index}
              style={[
                styles.lineTranslationText,
                {
                  textAlign,
                  lineHeight: lineHeight * 0.8,
                  fontSize: size * 0.8,
                  fontWeight: '400',
                  color: 'rgba(255, 255, 255, 0.35)',
                },
              ]}
              textBreakStrategy="simple"
            >
              {lrc}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.lineNum === nextProps.lineNum &&
    prevProps.line === nextProps.line &&
    prevProps.lrcFontSize === nextProps.lrcFontSize &&
    prevProps.textAlign === nextProps.textAlign &&
    (prevProps.activeLine === prevProps.lineNum) === (nextProps.activeLine === nextProps.lineNum) &&
    (prevProps.activeLine !== prevProps.lineNum)
  )
})

const wait = async() => new Promise(resolve => setTimeout(resolve, 80))

export default () => {
  const lyricLines = useLrcSet()
  const { line } = useLrcPlay()
  const flatListRef = useRef<FlatList>(null)
  const playLineRef = useRef<PlayLineType>(null)
  const isPauseScrollRef = useRef(false)
  const scrollTimoutRef = useRef<NodeJS.Timeout | null>(null)
  const lineRef = useRef({ line: 0, prevLine: 0 })
  const isFirstSetLrc = useRef(true)
  const listLayoutInfoRef = useRef<{ spaceHeight: number, lineHeights: number[] }>({ spaceHeight: 0, lineHeights: [] })
  const isShowLyricProgressSetting = useSettingValue('playDetail.isShowLyricProgressSetting')
  const lrcFontSize = useSettingValue('playDetail.vertical.style.lrcFontSize')
  const textAlign = useSettingValue('playDetail.style.align')

  // 原生硬件加速平滑滚动到激活行，杜绝 JS 线程 10ms 频繁步进造成的掉帧与卡死
  const handleScrollToActive = useCallback((index = lineRef.current.line) => {
    if (index < 0 || !flatListRef.current) return
    try {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.42,
      })
    } catch {
      // 容错兜底
    }
  }, [])

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isPauseScrollRef.current) {
      playLineRef.current?.updateScrollInfo(nativeEvent)
    }
  }

  const handleScrollBeginDrag = () => {
    isPauseScrollRef.current = true
    playLineRef.current?.setVisible(true)
    if (scrollTimoutRef.current) {
      clearTimeout(scrollTimoutRef.current)
      scrollTimoutRef.current = null
    }
  }

  const onScrollEndDrag = () => {
    if (scrollTimoutRef.current) clearTimeout(scrollTimoutRef.current)
    scrollTimoutRef.current = setTimeout(() => {
      playLineRef.current?.setVisible(false)
      scrollTimoutRef.current = null
      isPauseScrollRef.current = false
      if (!playerState.isPlay) return
      handleScrollToActive()
    }, 2500)
  }

  useEffect(() => {
    return () => {
      if (scrollTimoutRef.current) {
        clearTimeout(scrollTimoutRef.current)
        scrollTimoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    listLayoutInfoRef.current.lineHeights = []
    lineRef.current.prevLine = 0
    lineRef.current.line = 0
    if (!flatListRef.current) return
    flatListRef.current.scrollToOffset({
      offset: 0,
      animated: false,
    })
    if (!lyricLines.length) return
    playLineRef.current?.updateLyricLines(lyricLines)
    requestAnimationFrame(() => {
      if (isFirstSetLrc.current) {
        isFirstSetLrc.current = false
        setTimeout(() => {
          isPauseScrollRef.current = false
          handleScrollToActive()
        }, 120)
      } else {
        setTimeout(() => {
          handleScrollToActive(0)
        }, 80)
      }
    })
  }, [lyricLines, handleScrollToActive])

  // 歌词行切换时，毫秒级响应滚动，消除 600ms 滞后
  useEffect(() => {
    if (line < 0) return
    lineRef.current.prevLine = lineRef.current.line
    lineRef.current.line = line
    if (!flatListRef.current || isPauseScrollRef.current) return

    handleScrollToActive(line)
  }, [line, handleScrollToActive])

  useEffect(() => {
    requestAnimationFrame(() => {
      playLineRef.current?.updateLayoutInfo(listLayoutInfoRef.current)
      playLineRef.current?.updateLyricLines(lyricLines)
    })
  }, [isShowLyricProgressSetting, lyricLines])

  const handleScrollToIndexFailed: FlatListType['onScrollToIndexFailed'] = (info) => {
    const spaceH = listLayoutInfoRef.current.spaceHeight || 200
    const approxOffset = spaceH + info.index * 44
    try {
      flatListRef.current?.scrollToOffset({
        offset: Math.max(0, approxOffset - 200),
        animated: false,
      })
    } catch {}
    void wait().then(() => {
      handleScrollToActive(info.index)
    })
  }

  const handleLineLayout = useCallback<LineProps['onLayout']>((lineNum, height) => {
    listLayoutInfoRef.current.lineHeights[lineNum] = height
    playLineRef.current?.updateLayoutInfo(listLayoutInfoRef.current)
  }, [])

  const handleSpaceLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    listLayoutInfoRef.current.spaceHeight = nativeEvent.layout.height
    playLineRef.current?.updateLayoutInfo(listLayoutInfoRef.current)
  }, [])

  const handlePlayLine = useCallback((time: number) => {
    playLineRef.current?.setVisible(false)
    global.app_event.setProgress(time)
  }, [])

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => {
    const nextLine = lyricLines[index + 1]
    const duration = nextLine && nextLine.time > item.time
      ? nextLine.time - item.time
      : 3500

    return (
      <LrcLine
        line={item}
        lineNum={index}
        activeLine={line}
        duration={duration}
        lrcFontSize={lrcFontSize}
        textAlign={textAlign}
        onLayout={handleLineLayout}
      />
    )
  }

  const getkey: FlatListType['keyExtractor'] = (item, index) => `${index}${item.text}`

  const spaceComponent = useMemo(() => (
    <View style={styles.space} onLayout={handleSpaceLayout} />
  ), [handleSpaceLayout])

  const statusText = useStatusText()
  const emptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyIcon}>🎵</Text>
        <Text style={styles.emptyText}>
          {playerState.musicInfo.id ? (statusText || '正在加载歌词...') : '暂无播放歌曲'}
        </Text>
      </View>
    </View>
  ), [statusText])

  return (
    <>
      <FlatList
        data={lyricLines}
        renderItem={renderItem}
        keyExtractor={getkey}
        style={styles.container}
        ref={flatListRef}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={lyricLines.length ? spaceComponent : null}
        ListFooterComponent={lyricLines.length ? spaceComponent : null}
        ListEmptyComponent={emptyComponent}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        fadingEdgeLength={100}
        initialNumToRender={Math.max(line + 15, 20)}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        onScroll={handleScroll}
      />
      {isShowLyricProgressSetting ? <PlayLine ref={playLineRef} onPlayLine={handlePlayLine} /> : null}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 24,
    paddingRight: 24,
  },
  space: {
    paddingTop: '90%',
  },
  emptyContainer: {
    paddingTop: '60%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  line: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeLineWrapper: {
    paddingVertical: 12,
  },
  activeTextContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  inactiveTextContainer: {
    alignItems: 'center',
  },
  lineText: {
    textAlign: 'center',
  },
  karaokeMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  lineTranslationText: {
    textAlign: 'center',
    paddingTop: 6,
  },
})
