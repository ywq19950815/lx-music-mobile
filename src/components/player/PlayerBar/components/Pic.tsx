import { StyleSheet, TouchableOpacity, View, Animated, Easing } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import { LIST_IDS, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import Image from '@/components/common/Image'
import { useCallback, useEffect, useRef } from 'react'
import { setLoadErrorPicUrl, setMusicInfo } from '@/core/player/playInfo'

const PIC_HEIGHT = scaleSizeH(44)
const CENTER_PIC_SIZE = scaleSizeH(28)
const HOLE_SIZE = scaleSizeH(6)

const styles = StyleSheet.create({
  diskContainer: {
    width: PIC_HEIGHT,
    height: PIC_HEIGHT,
    borderRadius: PIC_HEIGHT / 2,
    backgroundColor: '#0D0F14',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  diskGroove: {
    width: PIC_HEIGHT - 4,
    height: PIC_HEIGHT - 4,
    borderRadius: (PIC_HEIGHT - 4) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPic: {
    width: CENTER_PIC_SIZE,
    height: CENTER_PIC_SIZE,
    borderRadius: CENTER_PIC_SIZE / 2,
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

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const handlePress = () => {
    navigations.pushPlayDetailScreen(commonState.componentIds.home || 'home')
    if (typeof window !== 'undefined' && (window as any).__lxTogglePlayDetail) {
      (window as any).__lxTogglePlayDetail(true)
    }
    globalThis.app_event?.emit('openPlayDetail')
  }

  const handleLongPress = () => {
    if (!isHome) return
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId == LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
    setMusicInfo({
      pic: null,
    })
  }, [])

  return (
    <TouchableOpacity onLongPress={handleLongPress} onPress={handlePress} activeOpacity={0.8} style={{ paddingLeft: 2 }}>
      <Animated.View style={[styles.diskContainer, { transform: [{ rotate: spin }] }]}>
        <View style={styles.diskGroove}>
          <Image url={musicInfo.pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={styles.centerPic} onError={handleError} />
          <View style={styles.centerHole} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  )
}
