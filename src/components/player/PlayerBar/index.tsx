import { memo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useKeyboard } from '@/utils/hooks'

import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useProgress } from '@/store/player/hook'


export default memo(({ isHome = false }: { isHome?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const theme = useTheme()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const { progress } = useProgress(true)

  if (autoHidePlayBar && keyboardShown) return null

  const progressPercent = Math.min(100, Math.max(0, (progress || 0) * 100))

  return (
    <View style={styles.outerWrapper}>
      <View style={{
        ...styles.container,
        backgroundColor: theme['c-primary-light-700-alpha-500'] ?? theme['c-content-background'],
        borderColor: theme['c-border-background'] ?? 'rgba(128, 128, 148, 0.16)',
      }}>
        <Pic isHome={isHome} />
        <View style={styles.center}>
          <Title isHome={isHome} />
          <PlayInfo isHome={isHome} />
        </View>
        <View style={styles.right}>
          <ControlBtn />
        </View>
        <View style={styles.bottomProgressTrack}>
          <View style={[styles.bottomProgressBar, { width: `${progressPercent}%`, backgroundColor: theme['c-primary-font'] ?? theme['c-primary'] }]} />
        </View>
      </View>
    </View>
  )
})


const styles = createStyle({
  outerWrapper: {
    width: '100%',
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  container: {
    width: '100%',
    paddingVertical: 7,
    paddingLeft: 7,
    paddingRight: 6,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  left: {
    flexGrow: 0,
    flexShrink: 0,
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 8,
    height: '100%',
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingLeft: 4,
    paddingRight: 4,
  },
  bottomProgressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 14,
    right: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(128, 128, 148, 0.16)',
    overflow: 'hidden',
  },
  bottomProgressBar: {
    height: '100%',
    borderRadius: 1,
  },
})
