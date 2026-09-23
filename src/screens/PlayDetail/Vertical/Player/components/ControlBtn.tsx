import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { BTN_WIDTH } from './MoreBtn/Btn'
import { useMemo } from 'react'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

const PrevBtn = ({ size }: { size: number }) => {
  const btnSize = size * 0.85
  return (
    <View style={styles.subBtnWrapper}>
      <TouchableOpacity
        style={[
          styles.controlSubBtn,
          { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
        ]}
        activeOpacity={0.7}
        onPress={() => { void playPrev() }}
      >
        <Icon name='prevMusic' color={neoColors.black} rawSize={btnSize * 0.52} />
      </TouchableOpacity>
    </View>
  )
}

const NextBtn = ({ size }: { size: number }) => {
  const btnSize = size * 0.85
  return (
    <View style={styles.subBtnWrapper}>
      <TouchableOpacity
        style={[
          styles.controlSubBtn,
          { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
        ]}
        activeOpacity={0.7}
        onPress={() => { void playNext() }}
      >
        <Icon name='nextMusic' color={neoColors.black} rawSize={btnSize * 0.52} />
      </TouchableOpacity>
    </View>
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const isPlay = useIsPlay()
  const playBtnSize = Math.max(56, size * 1.08)

  return (
    <View style={styles.mainBtnWrapper}>
      <TouchableOpacity
        style={[
          styles.mainPlayBtn,
          {
            width: playBtnSize,
            height: playBtnSize,
            borderRadius: playBtnSize / 2,
            backgroundColor: isPlay ? neoColors.pink : neoColors.yellow,
          },
        ]}
        activeOpacity={0.7}
        onPress={togglePlay}
      >
        <Icon name={isPlay ? 'pause' : 'play'} color={neoColors.black} rawSize={playBtnSize * 0.52} />
      </TouchableOpacity>
    </View>
  )
}

const MAX_SIZE = BTN_WIDTH * 1.6
const MIN_SIZE = BTN_WIDTH * 1.2

export default () => {
  const winSize = useWindowSize()
  const maxHeight = Math.max(winSize.height * 0.11, MIN_SIZE)
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
      <TogglePlayBtn size={size}/>
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
    paddingVertical: 14,
  },
  subBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlSubBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: neoColors.white,
    borderWidth: 2,
    borderColor: neoColors.black,
    ...neoShadows.sm,
  },
  mainBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: neoColors.black,
    ...neoShadows.md,
  },
})
