import { memo, useCallback, useState } from 'react'
import { View, StyleSheet } from 'react-native'

import Progress, { ProgressPlain } from '@/components/player/Progress'
import Status from './Status'
import { useProgress } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { colors } from '@/theme/tokens'
import { COMPONENT_IDS } from '@/config/constant'
import { usePageVisible } from '@/store/common/hook'
import { useBufferProgress } from '@/plugins/player'
import { useSettingValue } from '@/store/setting/hook'

const PlayTimeCurrent = ({ timeStr }: { timeStr: string }) => {
  return <Text size={11} color={colors.inkSecondary} style={styles.timeText}>{timeStr}</Text>
}

const PlayTimeMax = memo(({ timeStr }: { timeStr: string }) => {
  return <Text size={11} color={colors.inkTertiary} style={styles.timeText}>{timeStr}</Text>
})

export default ({ isHome }: { isHome: boolean }) => {
  const [autoUpdate, setAutoUpdate] = useState(true)
  const { maxPlayTimeStr, nowPlayTimeStr, progress, maxPlayTime } = useProgress(autoUpdate)
  const buffered = useBufferProgress()
  const allowProgressBarSeek = useSettingValue('common.allowProgressBarSeek')

  usePageVisible([COMPONENT_IDS.home], useCallback((visible) => {
    if (isHome) setAutoUpdate(visible)
  }, [isHome]))

  return (
    <View style={styles.container}>
      {/* 顶部文字信息行：左侧歌手/歌词状态，右侧当前播放时间 */}
      <View style={styles.infoRow}>
        <View style={styles.status}>
          <Status autoUpdate={autoUpdate} />
        </View>
        <View style={styles.timeRow}>
          <PlayTimeCurrent timeStr={nowPlayTimeStr} />
          <Text size={10.5} color={colors.inkTertiary} style={styles.timeDivider}> / </Text>
          <PlayTimeMax timeStr={maxPlayTimeStr} />
        </View>
      </View>

      {/* 细致进度条 */}
      <View style={styles.progressRow}>
        {
          allowProgressBarSeek
            ? <Progress progress={progress} duration={maxPlayTime} buffered={buffered} />
            : <ProgressPlain progress={progress} duration={maxPlayTime} buffered={buffered} />
        }
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  status: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  timeText: {
    fontWeight: '600',
  },
  timeDivider: {
    fontWeight: '400',
    marginHorizontal: 1,
  },
  progressRow: {
    width: '100%',
    marginTop: 3,
  },
})
