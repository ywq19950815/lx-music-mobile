import Text from '@/components/common/Text'
import { StyleSheet, View } from 'react-native'
import { useI18n } from '@/lang'
import { colors } from '@/theme/tokens'

export default ({ musicInfo, isMove }: {
  musicInfo: LX.Music.MusicInfo
  isMove: boolean
}) => {
  const t = useI18n()
  return (
    <View style={styles.container}>
      <Text style={styles.actionText}>
        {isMove ? '移动到歌单' : '收藏到歌单'}
      </Text>
      <Text style={styles.subText} numberOfLines={1}>
        当前歌曲：{musicInfo.name} - {musicInfo.singer}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subText: {
    fontSize: 12,
    color: colors.inkTertiary,
    marginTop: 3,
  },
})
