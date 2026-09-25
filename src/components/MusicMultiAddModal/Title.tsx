import Text from '@/components/common/Text'
import { StyleSheet, View } from 'react-native'
import { colors } from '@/theme/tokens'

export default ({ selectedList, isMove }: {
  selectedList: LX.Music.MusicInfo[]
  isMove: boolean
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.actionText}>
        {isMove ? '批量移动到歌单' : '批量收藏到歌单'}
      </Text>
      <Text style={styles.subText}>
        已选择 {selectedList.length} 首歌曲
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
