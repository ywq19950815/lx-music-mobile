import { useRef, useCallback, useMemo } from 'react'
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { BTN_WIDTH } from './MoreBtn/Btn'
import { motion, useAppColors } from '@/theme/tokens'

/**
 * 播放页主控区（2026-09-29 设计稿：浅色黑胶台 / 深色双主题）：
 * - 次级（上一首/下一首）：轻盈无底图标（浅色墨字 / 深色纯白），带精致轻触缩放反馈
 * - 主控（播放/暂停）：品牌绿大圆钮，高品质呼吸光晕，纯白图标，spring 弹性按压缩放
 */
const PrevBtn = ({ size, iconColor }: { size: number, iconColor: string }) => {
  const scale = useRef(new Animated.Value(1)).current
  const pressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.88, friction: motion.spring.friction, tension: motion.spring.tension, useNativeDriver: true }).start()
  }, [scale])
  const pressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, friction: motion.spring.friction, tension: motion.spring.tension, useNativeDriver: true }).start()
  }, [scale])

  const hitSize = Math.max(48, size * 0.9)

  return (
    <Animated.View style={[styles.subBtnWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.controlSubBtn, { width: hitSize, height: hitSize, borderRadius: hitSize / 2 }]}
        activeOpacity={0.7}
        onPress={() => { void playPrev() }}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <Icon name="prevMusic" color={iconColor} rawSize={26} />
      </TouchableOpacity>
    </Animated.View>
  )
}

const NextBtn = ({ size, iconColor }: { size: number, iconColor: string }) => {
  const scale = useRef(new Animated.Value(1)).current
  const pressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.88, friction: motion.spring.friction, tension: motion.spring.tension, useNativeDriver: true }).start()
  }, [scale])
  const pressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, friction: motion.spring.friction, tension: motion.spring.tension, useNativeDriver: true }).start()
  }, [scale])

  const hitSize = Math.max(48, size * 0.9)

  return (
    <Animated.View style={[styles.subBtnWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.controlSubBtn, { width: hitSize, height: hitSize, borderRadius: hitSize / 2 }]}
        activeOpacity={0.7}
        onPress={() => { void playNext() }}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <Icon name="nextMusic" color={iconColor} rawSize={26} />
      </TouchableOpacity>
    </Animated.View>
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const isPlay = useIsPlay()
  const playBtnSize = Math.max(62, size * 1.18)
  const scale = useRef(new Animated.Value(1)).current

  const pressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.92,
      friction: motion.spring.friction,
      tension: motion.spring.tension,
      useNativeDriver: true,
    }).start()
  }, [scale])

  const pressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: motion.spring.friction,
      tension: motion.spring.tension,
      useNativeDriver: true,
    }).start()
  }, [scale])

  return (
    <View style={styles.mainBtnWrapper}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          testID="main-play-btn"
          style={[
            styles.mainPlayBtn,
            {
              width: playBtnSize,
              height: playBtnSize,
              borderRadius: playBtnSize / 2,
              backgroundColor: isPlay ? '#10B981' : '#059669',
            },
          ]}
          activeOpacity={1}
          onPress={togglePlay}
          onPressIn={pressIn}
          onPressOut={pressOut}
        >
          <Icon name={isPlay ? 'pause' : 'play'} color="#FFFFFF" rawSize={playBtnSize * 0.48} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const MAX_SIZE = BTN_WIDTH * 1.6
const MIN_SIZE = BTN_WIDTH * 1.2

export default () => {
  const winSize = useWindowSize()
  const c = useAppColors()
  const maxHeight = Math.max(winSize.height * 0.12, MIN_SIZE)
  const containerStyle = useMemo(() => {
    return {
      ...styles.container,
      maxHeight,
    }
  }, [maxHeight])
  const size = Math.min(Math.max(winSize.width * 0.33 * global.lx.fontSize * 0.4, MIN_SIZE), MAX_SIZE, maxHeight)
  const iconColor = c.ink

  return (
    <View style={containerStyle}>
      <PrevBtn size={size} iconColor={iconColor} />
      <TogglePlayBtn size={size} />
      <NextBtn size={size} iconColor={iconColor} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: '4%',
    paddingVertical: 10,
  },
  subBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 通透无边框轻盈触控区
  controlSubBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  mainBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
})
