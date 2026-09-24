import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { View, PanResponder } from 'react-native'
import { useDrag } from '@/utils/hooks'
import { createStyle } from '@/utils/tools'
import { colors } from '@/theme/tokens'

const DefaultBar = memo(() => {
  return (
    <View
      style={{
        ...styles.progressBar,
        backgroundColor: '#ECEEF1',
        position: 'absolute',
        width: '100%',
        left: 0,
        top: 0,
      }}
    />
  )
})

const BufferedBar = memo(({ progress }: { progress: number }) => {
  return (
    <View
      style={{
        ...styles.progressBar,
        backgroundColor: '#DFE2E6',
        position: 'absolute',
        width: `${Math.max(0, Math.min(100, progress * 100))}%`,
        left: 0,
        top: 0,
      }}
    />
  )
})

const PreassBar = memo(({ onDragState, setDragProgress, onSetProgress }: {
  onDragState: (drag: boolean) => void
  setDragProgress: (progress: number) => void
  onSetProgress: (progress: number) => void
}) => {
  const {
    onLayout,
    onDragStart,
    onDragEnd,
    onDrag,
  } = useDrag(onSetProgress, onDragState, setDragProgress)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderMove: (evt, gestureState) => {
        onDrag(gestureState.dx)
      },
      onPanResponderGrant: (evt, gestureState) => {
        onDragStart(gestureState.dx, evt.nativeEvent.locationX)
      },
      onPanResponderRelease: () => {
        onDragEnd()
      },
    }),
  ).current

  return <View onLayout={onLayout} style={styles.pressBar} {...panResponder.panHandlers} />
})


export const ProgressPlain = ({ progress, duration, buffered, paddingTop }: {
  progress: number
  duration: number
  buffered: number
  paddingTop?: number
}) => {
  const progressStr: `${number}%` = `${Math.max(0, Math.min(100, progress * 100))}%`

  const durationRef = useRef(duration)
  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  return (
    <View style={[styles.progress, paddingTop ? { paddingTop } : null]}>
      <View style={styles.trackContainer}>
        <DefaultBar />
        <BufferedBar progress={buffered} />
        <View style={[styles.progressBar, styles.activeBar, { width: progressStr }]} />
      </View>
      <View style={styles.pressBar} />
    </View>
  )
}

const Progress = ({ progress, duration, buffered, paddingTop }: {
  progress: number
  duration: number
  buffered: number
  paddingTop?: number
}) => {
  const [draging, setDraging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const progressStr: `${number}%` = `${Math.max(0, Math.min(100, progress * 100))}%`

  const durationRef = useRef(duration)
  useEffect(() => {
    durationRef.current = duration
  }, [duration])
  const onSetProgress = useCallback((progress: number) => {
    global.app_event.setProgress(progress * durationRef.current)
  }, [])

  return (
    <View style={[styles.progress, paddingTop ? { paddingTop } : null]}>
      <View style={styles.trackContainer}>
        <DefaultBar />
        <BufferedBar progress={buffered} />
        {
          draging
            ? (
                <>
                  <View style={[styles.progressBar, styles.activeBar, { width: progressStr, opacity: 0.6 }]} />
                  <View style={[styles.progressBar, styles.dragBar, { width: `${Math.max(0, Math.min(100, dragProgress * 100))}%` }]} />
                </>
              ) : (
                <View style={[styles.progressBar, styles.activeBar, { width: progressStr }]} />
              )
        }
      </View>
      <PreassBar onDragState={setDraging} setDragProgress={setDragProgress} onSetProgress={onSetProgress} />
    </View>
  )
}

const TRACK_HEIGHT = 4

const styles = createStyle({
  progress: {
    width: '100%',
    height: TRACK_HEIGHT,
    position: 'relative',
    justifyContent: 'center',
  },
  trackContainer: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
  },
  activeBar: {
    backgroundColor: colors.brand,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  dragBar: {
    backgroundColor: colors.brandDeep,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  pressBar: {
    position: 'absolute',
    left: 0,
    top: -6,
    bottom: -6,
    right: 0,
  },
})

export default Progress
