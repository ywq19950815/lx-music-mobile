import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'
import { formatMusicName } from '@/utils/tools'
import { colors } from '@/theme/tokens'

export default ({ isHome }: { isHome: boolean }) => {
  const musicInfo = usePlayerMusicInfo()
  const downloadFileName = useSettingValue('download.fileName')

  const handlePress = () => {
    navigations.pushPlayDetailScreen(commonState.componentIds.home || 'home')
    if (typeof window !== 'undefined' && (window as any).__lxTogglePlayDetail) {
      (window as any).__lxTogglePlayDetail(true)
    }
    globalThis.app_event?.emit('openPlayDetail')
  }

  const handleLongPress = () => {
    const listId = playerState.playMusicInfo.listId
    if (!listId || listId === LIST_IDS.DOWNLOAD) return
    global.app_event.jumpListPosition()
  }

  const hasTrack = !!musicInfo.id
  const songName = hasTrack ? musicInfo.name : '暂无播放歌曲'
  const singer = hasTrack ? (musicInfo.singer || '未知歌手') : '点击选择歌曲播放'

  return (
    <TouchableOpacity
      style={styles.container}
      onLongPress={handleLongPress}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.title} numberOfLines={1}>
        {songName}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {singer}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
  },
  title: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 13,
  },
  subtitle: {
    color: colors.inkTertiary,
    fontWeight: '500',
    fontSize: 11,
    marginTop: 2,
  },
})
