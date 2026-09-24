import { useRef, useCallback, useMemo } from 'react'
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { BTN_WIDTH } from './MoreBtn/Btn'
import { motion } from '@/theme/tokens'

/**
 * 播放页主控区：
 * - 次级（上一首/下一首）：微磨砂质感圆钮（柔和半透明白底 + 微边框 + 白图标）
 * - 主控（播放/暂停）：品牌暖金大圆钮，尊贵光晕投影，纯白图标，spring 弹性按压缩放
 */
const ON_NIGHT_ICON = 'rgba(255,255,255,0.92)'

const PrevBtn = ({ size }: { size: number }) => {
  const btnSize = size * 0.88
  return (
    <View style={styles.subBtnWrapper}>
      <TouchableOpacity
        style={[
          styles.controlSubBtn,
          { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
        ]}
        activeOpacity={0.65}
        onPress={() => { void playPrev() }}
      >
        <Icon name='prevMusic' color={ON_NIGHT_ICON} rawSize={btnSize * 0.50} />
      </TouchableOpacity>
    </View>
  )
}

const NextBtn = ({ size }: { size: number }) => {
  const btnSize = size * 0.88
  return (
    <View style={styles.subBtnWrapper}>
      <TouchableOpacity
        style={[
          styles.controlSubBtn,
          { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
        ]}
        activeOpacity={0.65}
        onPress={() => { void playNext() }}
      >
        <Icon name='nextMusic' color={ON_NIGHT_ICON} rawSize={btnSize * 0.50} />
      </TouchableOpacity>
    </View>
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const isPlay = useIsPlay()
  const playBtnSize = Math.max(60, size * 1.15)
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
              backgroundColor: isPlay ? '#F5A623' : '#E08C0F',
            },
          ]}
          activeOpacity={1}
          onPress={togglePlay}
          onPressIn={pressIn}
          onPressOut={pressOut}
        >
          <Icon name={isPlay ? 'pause' : 'play'} color="#FFFFFF" rawSize={playBtnSize * 0.50} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const MAX_SIZE = BTN_WIDTH * 1.6
const MIN_SIZE = BTN_WIDTH * 1.2

export default () => {
  const winSize = useWindowSize()
  const maxHeight = Math.max(winSize.height * 0.12, MIN_SIZE)
  const containerStyle = useMemo(() => {
    return {
      ...styles.container,
      maxHeight,
    }
  }, [maxHeight])
  const size = Math.min(Math.max(winSize.width * 0.33 * global.lx.fontSize * 0.4, MIN_SIZE), MAX_SIZE, maxHeight)

  return (
    <View style={containerStyle}>
      <PrevBtn size={size} />
      <TogglePlayBtn size={size} />
      <NextBtn size={size} />
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
    paddingVertical: 12,
  },
  subBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlSubBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  mainBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 8,
  },
})
