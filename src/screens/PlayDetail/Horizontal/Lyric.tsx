import { memo, useMemo, useEffect, useRef, useCallback, useState } from 'react'
import {
  View,
  FlatList,
  type FlatListProps,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  StyleSheet,
} from 'react-native'
import { type Line, useLrcPlay, useLrcSet, playbackClock } from '@/plugins/lyric'
import { useSettingValue } from '@/store/setting/hook'
import { useIsPlay } from '@/store/player/hook'
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

interface CharUnit {
  text: string
  startTime: number
  endTime: number
}

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
  const isPlay = useIsPlay()
  const baseSize = lrcFontSize / 10
  const size = active ? baseSize * 1.25 : baseSize * 0.85
  const lineHeight = setSpText(size) * 1.4

  const charUnits = useMemo<CharUnit[]>(() => {
    if (line.words && line.words.length > 0) {
      return line.words.map((w) => {
        const start = w.startTime
        const dur = Math.max(30, w.duration || 200)
        return {
          text: w.text,
          startTime: start,
          endTime: start + dur,
        }
      })
    }

    const fullText = line.text || ''
    if (!fullText) return []
    const chars = Array.from(fullText)
    const lineDur = Math.max(600, Math.min(duration || 3200, 15000))
    const charDur = lineDur / Math.max(1, chars.length)
    return chars.map((char, index) => ({
      text: char,
      startTime: line.time + index * charDur,
      endTime: line.time + (index + 1) * charDur,
    }))
  }, [line.words, line.text, line.time, duration])

  const [curTime, setCurTime] = useState(() => playbackClock.getTime())

  useEffect(() => {
    if (!active) return
    setCurTime(playbackClock.getTime())
    if (!isPlay) return

    const timer = setInterval(() => {
      setCurTime(playbackClock.getTime())
    }, 33)

    return () => {
      clearInterval(timer)
    }
  }, [active, isPlay])

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    onLayout(lineNum, nativeEvent.layout.height, nativeEvent.layout.width)
  }

  return (
    <View
      style={[styles.line, active ? styles.activeLineWrapper : null]}
      onLayout={handleLayout}
    >
      {active ? (
        <View style={styles.activeTextContainer}>
          <Text
            style={[
              styles.lineText,
              {
                textAlign,
                lineHeight,
                fontSize: size,
              },
            ]}
            textBreakStrategy="simple"
          >
            {charUnits.map((item, idx) => {
              const isPast = curTime >= item.endTime
              const isCurrent = curTime >= item.startTime && curTime < item.endTime

              let color = 'rgba(255, 255, 255, 0.40)'
              let fontWeight: any = '600'
              let opacity = 0.85

              if (isPast) {
                color = designColors.brand
                fontWeight = '700'
                opacity = 1
              } else if (isCurrent) {
                color = designColors.brand
                fontWeight = '800'
                opacity = 1
              }

              return (
                <Text
                  key={idx}
                  style={{
                    color,
                    fontWeight,
                    opacity,
                  }}
                >
                  {item.text}
                </Text>
              )
            })}
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
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.85)',
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
                color: 'rgba(255, 255, 255, 0.45)',
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
                  color: 'rgba(255, 255, 255, 0.30)',
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
  const lrcFontSize = useSettingValue('playDetail.horizontal.style.lrcFontSize')
  const textAlign = useSettingValue('playDetail.style.align')

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
    isFirstSetLrc.current = true
  }, [lyricLines])

  const handleScrollToIndexFailed = useCallback(() => {
    // 失败重试
  }, [])

  useEffect(() => {
    lineRef.current.line = line
    if (isPauseScrollRef.current) return
    if (isFirstSetLrc.current) {
      isFirstSetLrc.current = false
      setTimeout(() => {
        handleScrollToActive(line)
      }, 300)
      return
    }
    handleScrollToActive(line)
  }, [line, handleScrollToActive])

  const handleLineLayout = useCallback((lineNum: number, height: number) => {
    listLayoutInfoRef.current.lineHeights[lineNum] = height
  }, [])

  const handleSpaceLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    listLayoutInfoRef.current.spaceHeight = nativeEvent.layout.height
  }, [])

  const handlePlayLine = useCallback((index: number) => {
    const targetLine = lyricLines[index]
    if (targetLine && targetLine.time) {
      playbackClock.reset(targetLine.time)
      global.app_event.setProgress(targetLine.time / 1000)
    }
  }, [lyricLines])

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => {
    const nextLine = lyricLines[index + 1]
    const lineDuration = nextLine ? (nextLine.time - item.time) : 3500
    return (
      <LrcLine
        line={item}
        lineNum={index}
        activeLine={line}
        duration={lineDuration}
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
      <Text style={styles.emptyText}>{playerState.musicInfo.id ? statusText : ''}</Text>
    </View>
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        initialNumToRender={Math.max(line + 10, 15)}
        maxToRenderPerBatch={8}
        windowSize={5}
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
    paddingLeft: 20,
    paddingRight: 20,
  },
  space: {
    paddingTop: 150,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    paddingTop: '20%',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  line: {
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  activeLineWrapper: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  activeTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineText: {
    textAlign: 'center',
  },
  lineTranslationText: {
    textAlign: 'center',
    paddingTop: 5,
  },
})
