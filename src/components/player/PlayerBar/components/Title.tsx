import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { navigations } from '@/navigation'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import commonState from '@/store/common/state'
import playerState from '@/store/player/state'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'
import { formatMusicName } from '@/utils/tools'
import { neoColors } from '@/theme/neobrutalism'

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
  const songName = hasTrack ? musicInfo.name : 'NEO PLAYLIST'
  const singer = hasTrack ? (musicInfo.singer || '安迪音乐') : '点击选择歌曲播放'

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
    color: neoColors.black,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: neoColors.gray700,
    fontWeight: '700',
    fontSize: 11,
    marginTop: 1,
  },
})
