import { useRef, useCallback } from 'react'
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useIsPlay, usePlayerMusicInfo } from '@/store/player/hook'
import { playNext, playPrev, togglePlay, playList } from '@/core/player/player'
import { useHorizontalMode } from '@/utils/hooks'
import { motion } from '@/theme/tokens'
import listState from '@/store/list/state'
import { getListMusics } from '@/core/list'
import { LIST_IDS } from '@/config/constant'

const handlePlayPrev = () => {
  void playPrev()
  globalThis.player_event?.emit('playPrev')
}
const handlePlayNext = () => {
  void playNext()
  globalThis.player_event?.emit('playNext')
}

/** 按压弹簧缩放 Hook（迷你条按钮共用） */
const usePressSpring = () => {
  const scale = useRef(new Animated.Value(1)).current
  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.88,
      friction: motion.spring.friction,
      tension: motion.spring.tension,
      useNativeDriver: true,
    }).start()
  }, [scale])
  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: motion.spring.friction,
      tension: motion.spring.tension,
      useNativeDriver: true,
    }).start()
  }, [scale])
  return { scale, onPressIn, onPressOut }
}

const PlayNextBtn = () => {
  const { scale, onPressIn, onPressOut } = usePressSpring()
  return (
    <Animated.View style={[styles.btnWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={handlePlayNext}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.sideBtn}
      >
        <Icon name="nextMusic" color="#5A616B" size={16} />
      </TouchableOpacity>
    </Animated.View>
  )
}

const PlayPrevBtn = () => {
  const { scale, onPressIn, onPressOut } = usePressSpring()
  return (
    <Animated.View style={[styles.btnWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={handlePlayPrev}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.sideBtn}
      >
        <Icon name="prevMusic" color="#5A616B" size={16} />
      </TouchableOpacity>
    </Animated.View>
  )
}

/** 主控播放/暂停键：品牌金圆钮，弹簧按压 */
const TogglePlayBtn = () => {
  const isPlay = useIsPlay()
  const musicInfo = usePlayerMusicInfo()
  const { scale, onPressIn, onPressOut } = usePressSpring()

  const handleToggle = () => {
    if (!musicInfo.id) {
      const activeListId = listState.activeListId || LIST_IDS.DEFAULT
      void getListMusics(activeListId).then(list => {
        if (list && list.length > 0) {
          void playList(activeListId, 0)
        } else {
          togglePlay()
        }
      })
      return
    }
    togglePlay()
  }

  return (
    <Animated.View style={[styles.btnWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleToggle}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.toggleBtn, { backgroundColor: isPlay ? '#F5A623' : '#E08C0F' }]}
      >
        <Icon
          name={isPlay ? 'pause' : 'play'}
          color="#FFFFFF"
          size={18}
        />
      </TouchableOpacity>
    </Animated.View>
  )
}

export default () => {
  const isHorizontal = useHorizontalMode()
  return (
    <View style={styles.btnRow}>
      {isHorizontal ? <PlayPrevBtn /> : null}
      <TogglePlayBtn />
      <PlayNextBtn />
    </View>
  )
}

const styles = StyleSheet.create({
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnWrapper: {
    width: 39,
    height: 39,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtn: {
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideBtn: {
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
