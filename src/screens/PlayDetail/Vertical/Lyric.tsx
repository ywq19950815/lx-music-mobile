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

// QQ 音乐标准歌词配色方案：
// - 未唱行/非激活行：柔和半透明浅白灰（对比克制，不抢视觉焦点）
// - 激活行未唱部分：高亮纯白（大字高亮待唱）
// - 激活行已唱部分/卡拉OK：鲜活 QQ 绿（#31C27C 唱过即逐字染色）
const COLOR_IDLE = 'rgba(255, 255, 255, 0.68)'
const COLOR_INACTIVE = 'rgba(255, 255, 255, 0.40)'
const COLOR_SUNG = designColors.brand

/**
 * 歌词行组件：
 * - 逐字模式（源提供 lxlrc 时）：严格按逐字时间戳染色，与歌声同步
 * - 行级模式（普通 lrc）：整行宽度线性擦染——
 *   1) 线性缓动（卡拉OK必须线性，曲线缓动会造成忽快忽慢）
 *   2) 进入行时按当前播放进度校准起始位置（中途打开播放页不重头跑）
 *   3) 暂停冻结 / 恢复续走
 *   4) seek 跳变（>600ms）自动重校准
 * - 播放时钟：进度广播只写 ref 校准基准（不触发渲染），本地插值推算，丝滑不掉帧
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
  // 激活行放大加粗为视觉主体大字（1.42x），未激活行收敛为背景副字（0.88x），层级极分明
  const size = active ? baseSize * 1.42 : baseSize * 0.88
  const lineHeight = setSpText(size) * 1.44
  const isPlay = useIsPlay()

  const words = line.words
  const isWordMode = !!words && words.length > 0

  // 逐字模式：当前已唱到的字索引
  const [wordIdx, setWordIdx] = useState(-1)
  // 行级模式：擦染进度
  const progressAnim = useRef(new Animated.Value(0)).current
  const [lineWidth, setLineWidth] = useState<number | null>(null)
  const [seekTick, setSeekTick] = useState(0)

  // ── 播放时钟 ─────────────────────────────
  const clockRef = useRef({ baseTime: 0, baseStamp: 0 })
  const frozenTRef = useRef<number | null>(null)

  const getCurTime = useCallback(() => {
    if (frozenTRef.current != null) return frozenTRef.current
    const clock = clockRef.current
    if (!clock.baseStamp) return line.time
    return clock.baseTime + (Date.now() - clock.baseStamp)
  }, [line])

  // 进度广播校准时钟；检测 seek 跳变（>600ms）触发行级动画重启
  useEffect(() => {
    if (!active) return
    const handleProgress = ({ nowPlayTime }: { nowPlayTime: number }) => {
      const prevT = getCurTime()
      clockRef.current.baseTime = nowPlayTime
      clockRef.current.baseStamp = Date.now()
      frozenTRef.current = null
      const newT = getCurTime()
      if (Math.abs(newT - prevT) > 600) setSeekTick(t => t + 1)
    }
    global.state_event.on('playProgressChanged', handleProgress)
    return () => {
      global.state_event.off('playProgressChanged', handleProgress)
    }
  }, [active, getCurTime])

  // 暂停冻结 / 恢复续走
  useEffect(() => {
    if (!active) {
      frozenTRef.current = null
      return
    }
    if (isPlay) {
      if (frozenTRef.current != null) {
        clockRef.current.baseTime = frozenTRef.current
        clockRef.current.baseStamp = Date.now()
        frozenTRef.current = null
        setSeekTick(t => t + 1)
      }
    } else {
      frozenTRef.current = getCurTime()
    }
  }, [isPlay, active, getCurTime])

  // 逐字模式驱动：本地时钟推算当前字索引（仅索引变化时 setState）
  useEffect(() => {
    if (!active || !isWordMode || !words) {
      setWordIdx(-1)
      return
    }
    const computeIdx = (t: number) => {
      let idx = -1
      for (let i = 0; i < words.length; i++) {
        if (words[i].startTime <= t) idx = i
        else break
      }
      return idx
    }
    if (!clockRef.current.baseStamp) {
      clockRef.current.baseTime = line.time
      clockRef.current.baseStamp = Date.now()
    }
    setWordIdx(computeIdx(getCurTime()))
    const timer = setInterval(() => {
      const idx = computeIdx(getCurTime())
      setWordIdx(prev => (prev === idx ? prev : idx))
    }, 60)
    return () => {
      clearInterval(timer)
    }
  }, [active, isWordMode, words, line, getCurTime])

  // 行级模式：线性擦染（起始校准 + 暂停跟随 + seek 重校准）
  useEffect(() => {
    if (!active || isWordMode) {
      progressAnim.stopAnimation()
      progressAnim.setValue(0)
      return
    }
    const dur = Math.max(800, Math.min(duration || 3500, 15000))
    const elapsed = getCurTime() - line.time
    const startFraction = elapsed > 0 && elapsed < dur ? elapsed / dur : 0
    progressAnim.stopAnimation()
    progressAnim.setValue(startFraction)
    if (isPlay && startFraction < 1) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: Math.max(200, dur * (1 - startFraction)),
        easing: Easing.linear,
        useNativeDriver: false,
      }).start()
    }
  }, [active, isWordMode, duration, isPlay, line, seekTick, progressAnim, getCurTime])

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

  const renderExtended = (alpha: number, sizeRatio: number, fontWeight: string) => (
    line.extendedLyrics.map((lrc, index) => (
      <Text
        key={index}
        style={[
          styles.lineTranslationText,
          {
            textAlign,
            lineHeight: lineHeight * 0.8,
            fontSize: size * sizeRatio,
            fontWeight,
            color: `rgba(255, 255, 255, ${alpha})`,
          },
        ]}
        textBreakStrategy="simple"
      >
        {lrc}
      </Text>
    ))
  )

  // 逐字染色主文本（仅激活行）
  const renderWordModeText = () => {
    if (!words) return null
    return (
      <Text
        style={[styles.lineText, { textAlign, lineHeight, fontSize: size, fontWeight: '700' }]}
        textBreakStrategy="simple"
      >
        {words.map((word, index) => (
          <Text key={index} style={{ color: index <= wordIdx ? COLOR_SUNG : COLOR_IDLE }}>
            {word.text}
          </Text>
        ))}
      </Text>
    )
  }

  return (
    <View
      style={[styles.line, active ? styles.activeLineWrapper : null]}
      onLayout={handleLayout}
    >
      {active && isWordMode ? (
        <View style={styles.activeTextContainer}>
          {renderWordModeText()}
          {renderExtended(0.8, 0.8, '600')}
        </View>
      ) : active ? (
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
                color: COLOR_IDLE,
              },
            ]}
            onLayout={handleTextLayout}
            textBreakStrategy="simple"
          >
            {line.text}
          </Text>

          {/* 顶层：线性擦染，与播放进度严格同步 */}
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

          {renderExtended(0.8, 0.8, '600')}
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
                color: COLOR_INACTIVE,
              },
            ]}
            textBreakStrategy="simple"
          >
            {line.text}
          </Text>
          {renderExtended(0.35, 0.8, '400')}
        </View>
      )}
    </View>
  )
}, (prevProps, nextProps) => {
  if (prevProps.lineNum !== nextProps.lineNum) return false
  if (prevProps.line !== nextProps.line) return false
  if (prevProps.lrcFontSize !== nextProps.lrcFontSize) return false
  if (prevProps.textAlign !== nextProps.textAlign) return false
  const prevActive = prevProps.activeLine === prevProps.lineNum
  const nextActive = nextProps.activeLine === nextProps.lineNum
  return prevActive === nextActive
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
    paddingTop: 56,
  },
  emptyContainer: {
    paddingTop: 40,
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
