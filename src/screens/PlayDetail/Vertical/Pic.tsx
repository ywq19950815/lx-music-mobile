import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { View, Animated, Easing, StyleSheet } from 'react-native'
import { createStyle } from '@/utils/tools'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { setLoadErrorPicUrl, setMusicInfo } from '@/core/player/playInfo'


export default ({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)

  useEffect(() => {
    if (animated) setPic(musicInfo.pic)
  }, [musicInfo.pic, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  // 黑胶唱片匀速旋转
  const rotateAnim = useRef(new Animated.Value(0)).current
  const currentAngle = useRef(0)
  const animRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    const listenerId = rotateAnim.addListener(({ value }) => {
      currentAngle.current = value
    })
    return () => {
      rotateAnim.removeListener(listenerId)
    }
  }, [rotateAnim])

  useEffect(() => {
    if (isPlay) {
      const remainingAngle = 1 - (currentAngle.current % 1)
      animRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: currentAngle.current + remainingAngle + 1,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
      animRef.current.start()
    } else {
      animRef.current?.stop()
      rotateAnim.stopAnimation((value) => {
        currentAngle.current = value
      })
    }

    return () => {
      animRef.current?.stop()
    }
  }, [isPlay, rotateAnim])

  const diskSpin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  // 唱针摆动动画（播放时放下搭在唱片上，暂停时抬起）
  const needleAnim = useRef(new Animated.Value(isPlay ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(needleAnim, {
      toValue: isPlay ? 1 : 0,
      duration: 350,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start()
  }, [isPlay, needleAnim])

  const needleRotate = needleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-25deg', '0deg'],
  })

  const diskSize = useMemo(() => {
    return Math.min(winWidth * 0.76, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.46)
  }, [statusBarHeight, winHeight, winWidth])

  const centerPicSize = Math.round(diskSize * 0.66)
  const spindleHoleSize = Math.max(16, Math.round(diskSize * 0.08))

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
    setMusicInfo({
      pic: null,
    })
  }, [])

  return (
    <View style={styles.container}>
      {/* 唱针组件（置于唱片顶层） */}
      <View style={styles.needlePivotAnchor} pointerEvents="none">
        <Animated.View style={[styles.needleArmWrapper, { transform: [{ rotate: needleRotate }] }]}>
          {/* 金属唱针轴承 */}
          <View style={styles.needlePivotBase} />
          {/* 唱针杆 */}
          <View style={styles.needleBar} />
          {/* 唱针头 */}
          <View style={styles.needleHead} />
        </Animated.View>
      </View>

      {/* 黑胶旋转大唱盘 */}
      <View style={[styles.diskOuterShadow, { width: diskSize, height: diskSize, borderRadius: diskSize / 2 }]}>
        <Animated.View style={[
          styles.vinylDisk,
          { width: diskSize, height: diskSize, borderRadius: diskSize / 2 },
          { transform: [{ rotate: diskSpin }] },
        ]}>
          {/* 唱片外层细刻线环 */}
          <View style={[styles.grooveRing1, { width: diskSize - 8, height: diskSize - 8, borderRadius: (diskSize - 8) / 2 }]}>
            <View style={[styles.grooveRing2, { width: diskSize - 20, height: diskSize - 20, borderRadius: (diskSize - 20) / 2 }]}>
              {/* 中心专辑封面 */}
              <View style={[styles.albumCoverWrapper, { width: centerPicSize, height: centerPicSize, borderRadius: centerPicSize / 2 }]}>
                <Image
                  url={pic}
                  nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
                  style={{ width: centerPicSize, height: centerPicSize, borderRadius: centerPicSize / 2 }}
                  onError={handleError}
                />
                {/* 唱机中央轴孔 */}
                <View style={[styles.spindleHole, { width: spindleHoleSize, height: spindleHoleSize, borderRadius: spindleHoleSize / 2 }]} />
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 30,
  },
  needlePivotAnchor: {
    position: 'absolute',
    top: 4,
    zIndex: 10,
    alignItems: 'center',
  },
  needleArmWrapper: {
    width: 60,
    height: 120,
    alignItems: 'center',
    // 旋转锚点位于轴承中心
    transformOrigin: 'top center',
  },
  needlePivotBase: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d8d8dc',
    borderWidth: 2,
    borderColor: '#8e8e93',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  needleBar: {
    width: 4,
    height: 75,
    backgroundColor: '#c7c7cc',
    borderRadius: 2,
    marginTop: -4,
  },
  needleHead: {
    width: 10,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#3a3a3c',
    marginTop: -2,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  diskOuterShadow: {
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylDisk: {
    backgroundColor: '#121215',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#24242a',
  },
  grooveRing1: {
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grooveRing2: {
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumCoverWrapper: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e1e24',
    elevation: 4,
  },
  spindleHole: {
    position: 'absolute',
    backgroundColor: '#0c0c0e',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
})
