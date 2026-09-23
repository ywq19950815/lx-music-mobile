import { useState } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useIsPlay, usePlayerMusicInfo } from '@/store/player/hook'
import { playNext, playPrev, togglePlay, playList } from '@/core/player/player'
import { useHorizontalMode } from '@/utils/hooks'
import { neoColors } from '@/theme/neobrutalism'
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

/**
 * NeoPlayNextBtn: Neo-Brutalism 实体波普下一曲按钮
 * - 纯黑硬实体阴影底座
 * - 纯白/荧光青高反差按键 + 2px 纯黑厚边框
 * - 物理按压下沉位移 (translateX/Y 2px)
 */
const PlayNextBtn = () => {
  const [isPressed, setIsPressed] = useState(false)
  return (
    <View style={styles.btnWrapper}>
      <View style={styles.btnShadow} />
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePlayNext}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={[
          styles.nextBtn,
          isPressed && styles.btnPressed,
        ]}
      >
        <Icon name="nextMusic" color={neoColors.black} size={16} />
      </TouchableOpacity>
    </View>
  )
}

/**
 * NeoPlayPrevBtn: Neo-Brutalism 实体波普上一曲按钮
 */
const PlayPrevBtn = () => {
  const [isPressed, setIsPressed] = useState(false)
  return (
    <View style={styles.btnWrapper}>
      <View style={styles.btnShadow} />
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePlayPrev}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={[
          styles.nextBtn,
          isPressed && styles.btnPressed,
        ]}
      >
        <Icon name="prevMusic" color={neoColors.black} size={16} />
      </TouchableOpacity>
    </View>
  )
}

/**
 * NeoTogglePlayBtn: 核心波普按键。
 * 亮黄/电光粉高饱和底色 + 2px 纯黑厚边框 + 实体硬阴影与按压下沉位移。
 */
const TogglePlayBtn = () => {
  const isPlay = useIsPlay()
  const musicInfo = usePlayerMusicInfo()
  const [isPressed, setIsPressed] = useState(false)

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
    <View style={styles.btnWrapper}>
      {/* 背后纯黑硬阴影 */}
      <View style={styles.btnShadow} />
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleToggle}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={[
          styles.toggleBtn,
          { backgroundColor: isPlay ? neoColors.pink : neoColors.yellow },
          isPressed && styles.btnPressed,
        ]}
      >
        <Icon
          name={isPlay ? 'pause' : 'play'}
          color={neoColors.black}
          size={18}
        />
      </TouchableOpacity>
    </View>
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
    position: 'relative',
    width: 39,
    height: 39,
  },
  btnShadow: {
    position: 'absolute',
    top: 2.5,
    left: 2.5,
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: neoColors.black,
    zIndex: 0,
  },
  toggleBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: neoColors.black,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  nextBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: neoColors.black,
    backgroundColor: neoColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  btnPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
})
