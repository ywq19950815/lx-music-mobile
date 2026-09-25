import { TouchableOpacity, View, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { toast } from '@/utils/tools'
import { useMusicExistsList } from '@/store/list/hook'
import { colors, radius } from '@/theme/tokens'

export default ({ listInfo, onPress, musicInfo }: {
  listInfo: LX.List.MyListInfo
  onPress: (listInfo: LX.List.MyListInfo) => void
  musicInfo: LX.Music.MusicInfo
  width?: number
}) => {
  const isExists = useMusicExistsList(listInfo, musicInfo)

  const handlePress = () => {
    if (isExists) {
      toast(global.i18n.t('list_add_tip_exists'))
      return
    }
    onPress(listInfo)
  }

  const isLove = listInfo.id === 'love'

  return (
    <TouchableOpacity
      style={[styles.itemRow, isExists && styles.itemRowDisabled]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, isLove && styles.iconBoxLove]}>
        <Icon
          name={isLove ? 'love' : 'logo'}
          size={18}
          color={isLove ? '#EF4444' : colors.brand}
        />
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.name} size={14.5} numberOfLines={1}>
          {listInfo.name}
        </Text>
        <Text style={styles.count} size={12}>
          {listInfo.id === 'default' ? '默认收藏' : isLove ? '我的我喜欢' : '我的歌单'}
        </Text>
      </View>
      {isExists ? (
        <View style={styles.existsTag}>
          <Text style={styles.existsText} size={11}>已在歌单</Text>
        </View>
      ) : (
        <Icon name="add-music" size={16} color={colors.inkTertiary} />
      )}
    </TouchableOpacity>
  )
}

export const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  itemRowDisabled: {
    opacity: 0.6,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBoxLove: {
    backgroundColor: '#FEE2E2',
  },
  infoBox: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 3,
  },
  count: {
    color: colors.inkTertiary,
  },
  existsTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.pill,
  },
  existsText: {
    color: colors.inkTertiary,
    fontWeight: '500',
  },
})
