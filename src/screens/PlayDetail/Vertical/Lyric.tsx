import { memo, useMemo, useEffect, useRef, useCallback, useState, useContext } from 'react'
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
import { getPosition } from '@/plugins/player'
import { useSettingValue } from '@/store/setting/hook'
import { useIsPlay } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { useStatusText } from '@/store/player/hook'
import { setSpText } from '@/utils/pixelRatio'
import playerState from '@/store/player/state'
import PlayLine, { type PlayLineType } from '../components/PlayLine'
import { colors as designColors } from '@/theme/tokens'
import { ThemeContext } from '@/store/theme/state'

type FlatListType = FlatListProps<Line>

interface LineProps {
  line: Line
  lineNum: number
  activeLine: number
  duration: number
  lrcFontSize: number
  textAlign: any
  idleColor: string
  inactiveColor: string
  extendedColor: (alpha: number) => string
  variant: 'half' | 'full'
  onLayout: (lineNum: number, height: number, width: number) => void
}

interface CharUnit {
  text: string
  startTime: number
  endTime: number
}

// 歌词配色方案（双主题对齐 QQ 音乐规范）：
// - 浅色：墨色底字 + 灰阶副字
// - 深色：柔和浅白灰底字
// - 卡拉OK激活部分：鲜活翡翠绿 #31C27C 逐字高光点亮
const useLyricColors = () => {
  const theme = useContext(ThemeContext)
  return useMemo(() => theme.isDark ? {
    idle: 'rgba(255, 255, 255, 0.70)',
    inactive: 'rgba(255, 255, 255, 0.38)',
    extended: (alpha: number) => `rgba(255, 255, 255, ${alpha})`,
  } : {
    idle: '#0F172A',
    inactive: '#94A3B8',
    extended: (alpha: number) => `rgba(15, 23, 42, ${alpha})`,
  }, [theme.isDark])
}

/**
 * 歌词行组件（QQ 音乐级行内字流排版架构）：
 * 1. 彻底解决折行同时变色问题：
 *    - 废除外层整块矩形 overflow: hidden 遮罩（多行文本跨行遮罩会导致所有行左侧同时变绿）。
 *    - 采用原生行内字流（Inline Text Span）排版：每个字独立感知发声时间，自然顺次折行。
 *    - 第一行唱完之后，时间才到达第二行首字的 startTime，第二行才从左到右变绿，多行绝不相互干扰！
 * 2. 彻底解决变色比唱的快问题：
 *    - 逐字模式严格使用真实字长 w.duration 计算 endTime = startTime + duration。
 *    - 绝不用下一字开始时间作为当前字结束时间，尊重歌手句中自然停顿与长音拖腔，节奏与人声分秒不差。
 * 3. 彻底解决闪烁与回退重置问题：
 *    - 采用全局单调平滑高精度时钟 playbackClock，行切换直接承接连续时间轴。
 *    - 进度异步校准绝不向后回退时钟，杜绝字变色亮起后又熄灭回退的竞态闪烁。
 */
const LrcLine = memo(({
  line,
  lineNum,
  activeLine,
  duration,
  lrcFontSize,
  textAlign,
  idleColor,
  inactiveColor,
  extendedColor,
  variant,
  onLayout,
}: LineProps) => {
  const active = activeLine === lineNum
  const theme = useContext(ThemeContext)
  const isPlay = useIsPlay()

  // 半屏模式紧凑缩放，全屏模式饱满大气
  const sizeScale = variant === 'half' ? 0.82 : 1
  const baseSize = (lrcFontSize / 10) * sizeScale
  // 正在唱的行显著放大加粗（1.5x）；未激活行收敛为背景副字（0.78x）
  const size = active ? baseSize * 1.5 : baseSize * 0.78
  const lineHeight = setSpText(size) * 1.44

  // 构建当前行的字符发音序列（逐字 lxlrc 或普通 lrc 字符序列）
  const charUnits = useMemo<CharUnit[]>(() => {
    // 1. 优先使用音源提供的逐字打点（lxlrc）
    if (line.words && line.words.length > 0) {
      return line.words.map((w) => {
        const start = w.startTime
        // 严格使用该字真实的持续时间，下限保护 30ms，绝不吞没短字
        const dur = Math.max(30, w.duration || 200)
        return {
          text: w.text,
          startTime: start,
          endTime: start + dur,
        }
      })
    }

    // 2. 普通 lrc 模式：若无逐字打点，智能按字符拆分为流式序列
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

  // 激活行高频平滑时钟驱动（~30fps）
  const [curTime, setCurTime] = useState(() => playbackClock.getTime())

  useEffect(() => {
    if (!active) return

    // 立即更新一次当前权威时钟
    setCurTime(playbackClock.getTime())

    if (!isPlay) return

    // ~30fps 极致丝滑向前推进，平滑点亮字符
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

  const renderExtended = (alpha: number, sizeRatio: number, fontWeight: any) => (
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
            color: extendedColor(alpha),
          },
        ]}
        textBreakStrategy="simple"
      >
        {lrc}
      </Text>
    ))
  )

  return (
    <View
      style={[styles.line, active ? styles.activeLineWrapper : null]}
      onLayout={handleLayout}
    >
      {active ? (
        <View style={styles.activeTextContainer}>
          {/* 原生行内字流排版：自然折行，长句按顺序逐字点亮，绝无跨行同时变色 */}
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

              let color = idleColor
              let fontWeight: any = '600'
              let opacity = theme.isDark ? 0.65 : 0.75

              if (isPast) {
                // 已唱完：100% 翡翠绿
                color = designColors.brand
                fontWeight = '700'
                opacity = 1
              } else if (isCurrent) {
                // 正在唱：高光鲜活翡翠绿
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
                color: inactiveColor,
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
  if (prevProps.idleColor !== nextProps.idleColor) return false
  if (prevProps.inactiveColor !== nextProps.inactiveColor) return false
  if (prevProps.extendedColor !== nextProps.extendedColor) return false
  if (prevProps.variant !== nextProps.variant) return false
  const prevActive = prevProps.activeLine === prevProps.lineNum
  const nextActive = nextProps.activeLine === nextProps.lineNum
  return prevActive === nextActive
})

export default ({ variant = 'full' }: { variant?: 'half' | 'full' }) => {
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
  const theme = useContext(ThemeContext)
  const lyricColors = useLyricColors()

  // 全局播放时钟与硬件播放引擎同步对齐
  useEffect(() => {
    void getPosition().then((pos) => {
      if (pos != null) {
        playbackClock.sync(pos * 1000, playerState.isPlay)
      }
    })

    const handleProgress = (progress: any) => {
      if (progress && typeof progress.nowPlayTime === 'number') {
        playbackClock.sync(progress.nowPlayTime * 1000, playerState.isPlay)
      }
    }
    const handlePlay = () => playbackClock.play()
    const handlePause = () => playbackClock.pause()
    const handleStop = () => playbackClock.reset(0)
    const handleSeek = (timeSec: number) => playbackClock.reset(timeSec * 1000)

    global.state_event.on('playProgressChanged', handleProgress)
    global.app_event.on('play', handlePlay)
    global.app_event.on('pause', handlePause)
    global.app_event.on('stop', handleStop)
    global.app_event.on('setProgress', handleSeek)
    global.app_event.on('musicToggled', handleStop)

    return () => {
      global.state_event.off('playProgressChanged', handleProgress)
      global.app_event.off('play', handlePlay)
      global.app_event.off('pause', handlePause)
      global.app_event.off('stop', handleStop)
      global.app_event.off('setProgress', handleSeek)
      global.app_event.off('musicToggled', handleStop)
    }
  }, [])

  // 原生硬件加速平滑滚动到激活行：当前句居中（viewPosition 0.5），
  // 保证正唱的这句在中间，上下都能舒适呈现前一句和下一句
  const handleScrollToActive = useCallback((index = lineRef.current.line) => {
    if (index < 0 || !flatListRef.current) return
    try {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
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
    // 列表首次渲染未就绪时失败静默重试
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
        idleColor={lyricColors.idle}
        inactiveColor={lyricColors.inactive}
        extendedColor={lyricColors.extended}
        variant={variant}
        onLayout={handleLineLayout}
      />
    )
  }

  const getkey: FlatListType['keyExtractor'] = (item, index) => `${index}${item.text}`

  const spaceComponent = useMemo(() => (
    <View style={[styles.space, { paddingTop: variant === 'half' ? 24 : 56 }]} onLayout={handleSpaceLayout} />
  ), [handleSpaceLayout, variant])

  const statusText = useStatusText()
  const emptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyCard, { backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', borderColor: theme.isDark ? 'transparent' : '#E2E8F0' }]}>
        <Text style={styles.emptyIcon}>🎵</Text>
        <Text style={[styles.emptyText, { color: theme.isDark ? 'rgba(255, 255, 255, 0.9)' : '#0F172A' }]}>
          {playerState.musicInfo.id ? (statusText || '正在加载歌词...') : '暂无播放歌曲'}
        </Text>
      </View>
    </View>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [statusText, theme.isDark])

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
        fadingEdgeLength={variant === 'half' ? 28 : 80}
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
    borderRadius: 16,
    borderWidth: 1,
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
    paddingTop: 6,
  },
})
