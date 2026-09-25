import { StyleSheet, TouchableOpacity, View, Animated, Easing } from 'react-native'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'
import { useCallback, useEffect, useRef } from 'react'
import { setLoadErrorPicUrl } from '@/core/player/playInfo'

const PIC_SIZE = scaleSizeH(44)
const CENTER_PIC_SIZE = scaleSizeH(28)
const HOLE_SIZE = scaleSizeH(6)

/**
 * 悬浮条黑胶唱片唱芯：
 * - 紧致同心刻度圈 + 中心黑金唱片贴 / 封面图
 * - 播放时匀速 360° 旋转，暂停保持当前角度
 */
export default ({ isHome }: { isHome: boolean }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
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
      const duration = Math.max(1000, remainingAngle * 16000)

      animRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: currentAngle.current + remainingAngle + 1,
          duration: 16000,
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

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
  }, [])

  return (
    <View style={styles.diskOuter}>
      <Animated.View style={[styles.diskContainer, { transform: [{ rotate: diskSpin }] }]}>
        <View style={styles.diskGroove}>
          {musicInfo.pic ? (
            <Image
              url={musicInfo.pic}
              nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
              style={styles.centerPic}
              onError={handleError}
            />
          ) : (
            <View style={styles.defaultCenter}>
              <Icon name="logo" size={12} color="#F5A623" />
            </View>
          )}
          {/* 中心黄铜转轴微孔 */}
          <View style={styles.centerHole} />
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  diskOuter: {
    paddingLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diskContainer: {
    width: PIC_SIZE,
    height: PIC_SIZE,
    borderRadius: PIC_SIZE / 2,
    backgroundColor: '#12141A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  diskGroove: {
    width: PIC_SIZE - 4,
    height: PIC_SIZE - 4,
    borderRadius: (PIC_SIZE - 4) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  centerPic: {
    width: CENTER_PIC_SIZE,
    height: CENTER_PIC_SIZE,
    borderRadius: CENTER_PIC_SIZE / 2,
  },
  defaultCenter: {
    width: CENTER_PIC_SIZE,
    height: CENTER_PIC_SIZE,
    borderRadius: CENTER_PIC_SIZE / 2,
    backgroundColor: '#1E2028',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerHole: {
    position: 'absolute',
    width: HOLE_SIZE,
    height: HOLE_SIZE,
    borderRadius: HOLE_SIZE / 2,
    backgroundColor: '#F5A623',
    borderWidth: 1,
    borderColor: '#0D0F14',
  },
})
