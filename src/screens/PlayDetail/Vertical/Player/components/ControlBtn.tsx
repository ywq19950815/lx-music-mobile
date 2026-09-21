import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay } from '@/store/player/hook'
import { createStyle } from '@/utils/tools'
import { useWindowSize } from '@/utils/hooks'
import { BTN_WIDTH } from './MoreBtn/Btn'
import { useMemo } from 'react'

const PrevBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const handlePlayPrev = () => {
    void playPrev()
  }
  return (
    <TouchableOpacity style={{ ...styles.controlSubBtn, width: size * 0.85, height: size * 0.85 }} activeOpacity={0.6} onPress={handlePlayPrev}>
      <Icon name='prevMusic' color={theme['c-button-font']} rawSize={size * 0.55} />
    </TouchableOpacity>
  )
}

const NextBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const handlePlayNext = () => {
    void playNext()
  }
  return (
    <TouchableOpacity style={{ ...styles.controlSubBtn, width: size * 0.85, height: size * 0.85 }} activeOpacity={0.6} onPress={handlePlayNext}>
      <Icon name='nextMusic' color={theme['c-button-font']} rawSize={size * 0.55} />
    </TouchableOpacity>
  )
}

const TogglePlayBtn = ({ size }: { size: number }) => {
  const theme = useTheme()
  const isPlay = useIsPlay()
  const playBtnSize = Math.max(54, size * 1.05)
  return (
    <TouchableOpacity
      style={[
        styles.mainPlayBtn,
        {
          width: playBtnSize,
          height: playBtnSize,
          borderRadius: playBtnSize / 2,
          backgroundColor: theme['c-primary-light-900-alpha-200'] ?? 'rgba(128, 128, 148, 0.18)',
          borderColor: theme['c-border-background'] ?? 'rgba(255, 255, 255, 0.15)',
        },
      ]}
      activeOpacity={0.7}
      onPress={togglePlay}
    >
      <Icon name={isPlay ? 'pause' : 'play'} color={theme['c-button-font']} rawSize={playBtnSize * 0.52} />
    </TouchableOpacity>
  )
}

const MAX_SIZE = BTN_WIDTH * 1.6
const MIN_SIZE = BTN_WIDTH * 1.2

export default () => {
  const winSize = useWindowSize()
  const maxHeight = Math.max(winSize.height * 0.11, MIN_SIZE)
  const containerStyle = useMemo(() => {
    return {
      ...styles.conatiner,
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

const styles = createStyle({
  conatiner: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: '4%',
    paddingVertical: 18,
  },
  controlSubBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(128, 128, 148, 0.08)',
  },
  mainPlayBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
})
