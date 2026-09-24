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
 * - 顶级发烧友黑金唱片 Label（LX AUDIO RECORDING · 33⅓ RPM STEREO）
 * - 真实声学唱机唱针系统：长臂钛金唱针，播放平滑下搭在 1 点钟音轨，暂停归位休眠
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

  // ── 真实黑胶唱针：0 (暂停靠右归位) → 1 (播放向左探入唱盘) ────
  const needleAnim = useRef(new Animated.Value(isPlay ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(needleAnim, {
      toValue: isPlay ? 1 : 0,
      duration: 440,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start()
  }, [isPlay, needleAnim])

  // 暂停时 0deg（垂直靠右归位），播放时 +32deg（精准搭在黑胶 1 点钟外音轨上）
  const needleRotate = needleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '32deg'],
  })

  // ── 尺寸自适应 ───────────────────────────
  const diskSize = useMemo(() => {
    return Math.min(winWidth * 0.74, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.45, 290)
  }, [statusBarHeight, winHeight, winWidth])

  const centerPicSize = Math.round(diskSize * 0.65)
  const spindleHoleSize = Math.max(16, Math.round(diskSize * 0.08))

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
  }, [])

  // 唱针轴心位于黑胶右上角肩膀上方
  const needleRightOffset = useMemo(() => {
    return Math.max(16, (winWidth - diskSize) / 2 - 6)
  }, [winWidth, diskSize])

  return (
    <View style={styles.container}>
      {/* 1. 真实黑胶唱针（长臂精密唱针：播放摆入黑胶音轨，暂停靠右归位） */}
      <View
        style={[
          styles.needlePivotAnchor,
          { right: needleRightOffset, top: 2 },
        ]}
        pointerEvents="none"
      >
        <Animated.View style={[styles.needleArmWrapper, { transform: [{ rotate: needleRotate }] }]}>
          {/* 金属精密轴承底座 */}
          <View style={styles.needlePivotBase}>
            <View style={styles.needlePivotInner} />
            <View style={styles.needlePivotDot} />
          </View>
          {/* 钛黑长连杆 */}
          <View style={styles.needleBar}>
            <View style={styles.needleHighlightEdge} />
          </View>
          {/* 唱头架过渡 */}
          <View style={styles.needleHeadshell}>
            {/* 专业拾音唱头 */}
            <View style={styles.needleCartridge}>
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
    paddingTop: 12,
  },
  // ── 唱针样式 ──────────────────────────────
  needlePivotAnchor: {
    position: 'absolute',
    zIndex: 15,
    alignItems: 'center',
  },
  needleArmWrapper: {
    width: 60,
    height: 145,
    alignItems: 'center',
    transformOrigin: 'top center',
  },
  needlePivotBase: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1C1E24',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  needlePivotInner: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
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
  needleBar: {
    width: 3.5,
    height: 138,
    backgroundColor: '#262830',
    borderRadius: 2,
    marginTop: -4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  needleHeadshell: {
    alignItems: 'center',
    marginTop: -2,
    transform: [{ rotate: '-14deg' }],
  },
  needleCartridge: {
    width: 14,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#16181E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  needleStylusLine: {
    width: 2,
    height: 12,
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
  },
  // ── 唱盘样式 ──────────────────────────────
  diskOuterShadow: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.60,
    shadowRadius: 28,
    elevation: 16,
  },
  vinylDisk: {
    backgroundColor: '#0D0F14',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  grooveRing1: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grooveRing2: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grooveRing3: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumCoverWrapper: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#15171E',
    borderWidth: 2,
    borderColor: 'rgba(245, 166, 35, 0.45)',
    position: 'relative',
  },
  // ── 默认唱片心（空状态） ─────────────────────
  defaultLabel: {
    backgroundColor: '#14151B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelRing: {
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.28)',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 166, 35, 0.03)',
    paddingVertical: 14,
  },
  labelUpperSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBrand: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F5A623',
    letterSpacing: 4,
  },
  labelCenterGap: {
    height: 24,
  },
  labelLowerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelSub: {
    fontSize: 7,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 1.5,
  },
  labelSpec: {
    fontSize: 6.5,
    fontWeight: '500',
    color: 'rgba(245, 166, 35, 0.65)',
    letterSpacing: 1,
    marginTop: 2,
  },
  // ── 转轴孔 ───────────────────────────────
  spindleHole: {
    position: 'absolute',
    backgroundColor: '#F5A623',
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  spindleCore: {
    backgroundColor: '#000000',
  },
})
