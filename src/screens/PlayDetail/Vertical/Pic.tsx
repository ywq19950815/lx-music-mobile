import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { View, Animated, StyleSheet, Easing } from 'react-native'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import Text from '@/components/common/Text'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { setLoadErrorPicUrl } from '@/core/player/playInfo'

/**
 * 播放详情页唱机系统（Pic）：
 * - 沉浸式曜黑黑胶大唱盘 + 多层同心刻线微纹理 + 完美正圆高品质投影
 * - 柔和金辉呼吸氛围光晕（Ambient Aura）
 * - 真实声学唱机唱针系统：基座严谨锚定在黑胶右上角，播放时精准下搭在黑胶1点钟音轨凹槽上，暂停顺滑抬起休眠
 * - 360° 平滑匀速旋转
 */
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

  // ── 黑胶匀速旋转 ──────────────────────────
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
          duration: 22000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
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

  // ── 真实黑胶唱针：0 (暂停抬起移开) → 1 (播放放下精准卡盘) ────
  const needleAnim = useRef(new Animated.Value(isPlay ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(needleAnim, {
      toValue: isPlay ? 1 : 0,
      duration: 380,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start()
  }, [isPlay, needleAnim])

  // 暂停时 -24deg（向右上方扬起移出唱盘），播放时 0deg（精准卡在黑胶1点钟音轨凹槽）
  const needleRotate = needleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-24deg', '0deg'],
  })

  // ── 尺寸自适应 ───────────────────────────
  const diskSize = useMemo(() => {
    return Math.min(winWidth * 0.76, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.46, 296)
  }, [statusBarHeight, winHeight, winWidth])

  const centerPicSize = Math.round(diskSize * 0.65)
  const spindleHoleSize = Math.max(16, Math.round(diskSize * 0.08))

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
  }, [])

  // 唱针基座位于唱盘右上角肩部正上方
  const needleBaseLeft = useMemo(() => {
    return (winWidth / 2) + 18
  }, [winWidth])

  return (
    <View style={styles.container}>
      {/* 1. 真实黑胶唱针（基座锚定于黑胶上方，播放时精准搭在黑胶音轨上） */}
      <View
        style={[
          styles.needleAnchor,
          { left: needleBaseLeft, top: 0 },
        ]}
        pointerEvents="none"
      >
        <Animated.View style={[styles.needleArmRotator, { transform: [{ rotate: needleRotate }] }]}>
          {/* 金属精密轴承底座 */}
          <View style={styles.needlePivotBase}>
            <View style={styles.needlePivotInner} />
            <View style={styles.needlePivotDot} />
          </View>

          {/* 唱针臂（长连杆） */}
          <View style={styles.needleArmPole}>
            <View style={styles.needleHighlightEdge} />
          </View>

          {/* 弯折唱头架 */}
          <View style={styles.needleHeadshell}>
            <View style={styles.needleCartridge}>
              {/* 唱针触针高亮细线 */}
              <View style={styles.needleStylusLine} />
            </View>
          </View>
        </Animated.View>
      </View>

      {/* 2. 背景微光金辉氛围光晕（Ambient Aura） */}
      <View
        style={[
          styles.ambientAura,
          {
            width: diskSize * 1.06,
            height: diskSize * 1.06,
            borderRadius: (diskSize * 1.06) / 2,
          },
        ]}
        pointerEvents="none"
      />

      {/* 3. 悬浮黑胶大唱盘（正圆软阴影） */}
      <View
        style={[
          styles.diskOuterShadow,
          {
            width: diskSize,
            height: diskSize,
            borderRadius: diskSize / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.vinylDisk,
            {
              width: diskSize,
              height: diskSize,
              borderRadius: diskSize / 2,
              transform: [{ rotate: diskSpin }],
            },
          ]}
        >
          {/* 外音轨反光细刻线 1 */}
          <View
            style={[
              styles.grooveRing1,
              {
                width: diskSize - 14,
                height: diskSize - 14,
                borderRadius: (diskSize - 14) / 2,
              },
            ]}
          >
            {/* 中音轨反光细刻线 2 */}
            <View
              style={[
                styles.grooveRing2,
                {
                  width: diskSize - 32,
                  height: diskSize - 32,
                  borderRadius: (diskSize - 32) / 2,
                },
              ]}
            >
              {/* 内音轨反光细刻线 3 */}
              <View
                style={[
                  styles.grooveRing3,
                  {
                    width: diskSize - 50,
                    height: diskSize - 50,
                    borderRadius: (diskSize - 50) / 2,
                  },
                ]}
              >
                {/* 中心唱片心（Label） */}
                <View
                  style={[
                    styles.albumCoverWrapper,
                    {
                      width: centerPicSize,
                      height: centerPicSize,
                      borderRadius: centerPicSize / 2,
                    },
                  ]}
                >
                  {pic ? (
                    <Image
                      url={pic}
                      nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
                      style={{
                        width: centerPicSize,
                        height: centerPicSize,
                        borderRadius: centerPicSize / 2,
                      }}
                      onError={handleError}
                    />
                  ) : (
                    /* 尊贵典藏版唱片心：避开轴孔，上中下分层排版 */
                    <View
                      style={[
                        styles.defaultLabel,
                        {
                          width: centerPicSize,
                          height: centerPicSize,
                          borderRadius: centerPicSize / 2,
                        },
                      ]}
                    >
                      {/* 同心精细金圈 */}
                      <View
                        style={[
                          styles.labelRing,
                          {
                            width: centerPicSize - 18,
                            height: centerPicSize - 18,
                            borderRadius: (centerPicSize - 18) / 2,
                          },
                        ]}
                      >
                        {/* 上半部：品牌标识 */}
                        <View style={styles.labelUpperSection}>
                          <Text style={styles.labelBrand}>LX</Text>
                        </View>

                        {/* 中间留给转轴孔的环形空隙 */}
                        <View style={styles.labelCenterGap} />

                        {/* 下半部：规格信息 */}
                        <View style={styles.labelLowerSection}>
                          <Text style={styles.labelSub}>AUDIO RECORDING</Text>
                          <Text style={styles.labelSpec}>33⅓ RPM · HI-FI</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* 唱机中央黄铜转轴孔与固定环 */}
                  <View
                    style={[
                      styles.spindleHole,
                      {
                        width: spindleHoleSize,
                        height: spindleHoleSize,
                        borderRadius: spindleHoleSize / 2,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.spindleCore,
                        {
                          width: spindleHoleSize * 0.45,
                          height: spindleHoleSize * 0.45,
                          borderRadius: (spindleHoleSize * 0.45) / 2,
                        },
                      ]}
                    />
                  </View>
                </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 16,
  },
  // ── 唱针样式 ──────────────────────────────
  needleAnchor: {
    position: 'absolute',
    zIndex: 20,
    width: 32,
    height: 32,
  },
  needleArmRotator: {
    width: 32,
    height: 140,
    alignItems: 'center',
    transformOrigin: 'top center',
  },
  needlePivotBase: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#202228',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 6,
  },
  needlePivotInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F5A623',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.5)',
  },
  needlePivotDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  needleArmPole: {
    width: 3.5,
    height: 98,
    backgroundColor: '#2A2D36',
    borderRadius: 2,
    position: 'relative',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.6)',
  },
  needleHighlightEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  needleHeadshell: {
    alignItems: 'center',
    marginTop: -2,
    transform: [{ rotate: '-18deg' }],
  },
  needleCartridge: {
    width: 13,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#16181E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  needleStylusLine: {
    width: 2,
    height: 10,
    backgroundColor: '#F5A623',
    borderRadius: 1,
  },
  // ── 背景氛围微光 ────────────────────────────
  ambientAura: {
    position: 'absolute',
    backgroundColor: 'rgba(245, 166, 35, 0.06)',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 36,
    elevation: 8,
  },
  // ── 悬浮黑胶大唱盘 ──────────────────────────
  diskOuterShadow: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.70,
    shadowRadius: 28,
    elevation: 20,
  },
  vinylDisk: {
    backgroundColor: '#0F1014',
    borderWidth: 2,
    borderColor: '#22252E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grooveRing1: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grooveRing2: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grooveRing3: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.035)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumCoverWrapper: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E2028',
    borderWidth: 2,
    borderColor: '#000000',
  },
  defaultLabel: {
    backgroundColor: '#131419',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelRing: {
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.28)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  labelUpperSection: {
    alignItems: 'center',
  },
  labelBrand: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F5A623',
    letterSpacing: 2,
  },
  labelCenterGap: {
    height: 20,
  },
  labelLowerSection: {
    alignItems: 'center',
    gap: 1,
  },
  labelSub: {
    fontSize: 6.5,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 1.2,
  },
  labelSpec: {
    fontSize: 5.5,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  spindleHole: {
    position: 'absolute',
    backgroundColor: '#B45309',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 3,
  },
  spindleCore: {
    backgroundColor: '#0F172A',
  },
})
