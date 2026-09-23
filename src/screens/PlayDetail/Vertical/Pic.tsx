import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { View, Animated, Easing, StyleSheet } from 'react-native'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { setLoadErrorPicUrl } from '@/core/player/playInfo'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

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
    return Math.min(winWidth * 0.68, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.36, 230)
  }, [statusBarHeight, winHeight, winWidth])

  const centerPicSize = Math.round(diskSize * 0.66)
  const spindleHoleSize = Math.max(16, Math.round(diskSize * 0.08))

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
  }, [])

  return (
    <View style={styles.container}>
      {/* 唱针组件（波普亮黄轴承与粉色针头） */}
      <View style={styles.needlePivotAnchor} pointerEvents="none">
        <Animated.View style={[styles.needleArmWrapper, { transform: [{ rotate: needleRotate }] }]}>
          {/* 波普亮黄轴承底座 */}
          <View style={styles.needlePivotBase} />
          {/* 纯黑唱针杆 */}
          <View style={styles.needleBar} />
          {/* 电光粉唱针头 */}
          <View style={styles.needleHead} />
        </Animated.View>
      </View>

      {/* 黑胶旋转大唱盘容器 */}
      <View style={[styles.diskOuterShadow, { width: diskSize, height: diskSize }]}>
        {/* 波普实体黑色硬阴影底座 */}
        <View style={[
          styles.diskHardShadow,
          { width: diskSize, height: diskSize, borderRadius: diskSize / 2 },
        ]} />

        {/* 旋转黑胶盘体 */}
        <Animated.View style={[
          styles.vinylDisk,
          { width: diskSize, height: diskSize, borderRadius: diskSize / 2 },
          { transform: [{ rotate: diskSpin }] },
        ]}>
          {/* 唱片外层细刻线环 */}
          <View style={[styles.grooveRing1, { width: diskSize - 10, height: diskSize - 10, borderRadius: (diskSize - 10) / 2 }]}>
            <View style={[styles.grooveRing2, { width: diskSize - 22, height: diskSize - 22, borderRadius: (diskSize - 22) / 2 }]}>
              {/* 中心专辑封面 */}
              <View style={[styles.albumCoverWrapper, { width: centerPicSize, height: centerPicSize, borderRadius: centerPicSize / 2 }]}>
                <Image
                  url={pic}
                  nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
                  style={{ width: centerPicSize, height: centerPicSize, borderRadius: centerPicSize / 2 }}
                  onError={handleError}
                />
                {/* 唱机中央波普明黄色轴孔 */}
                <View style={[styles.spindleHole, { width: spindleHoleSize, height: spindleHoleSize, borderRadius: spindleHoleSize / 2 }]} />
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 10,
  },
  needlePivotAnchor: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  needleArmWrapper: {
    width: 50,
    height: 95,
    alignItems: 'center',
    transformOrigin: 'top center',
  },
  needlePivotBase: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: neoColors.yellow,
    borderWidth: 2,
    borderColor: neoColors.black,
  },
  needleBar: {
    width: 3.5,
    height: 60,
    backgroundColor: neoColors.black,
    borderRadius: 2,
    marginTop: -3,
  },
  needleHead: {
    width: 10,
    height: 15,
    borderRadius: 2,
    backgroundColor: neoColors.pink,
    marginTop: -2,
    borderWidth: 1.5,
    borderColor: neoColors.black,
  },
  diskOuterShadow: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diskHardShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: neoColors.black,
  },
  vinylDisk: {
    backgroundColor: '#0F0F12',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3.5,
    borderColor: neoColors.black,
  },
  grooveRing1: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grooveRing2: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumCoverWrapper: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: neoColors.black,
  },
  spindleHole: {
    position: 'absolute',
    backgroundColor: neoColors.yellow,
    borderWidth: 2,
    borderColor: neoColors.black,
  },
})
