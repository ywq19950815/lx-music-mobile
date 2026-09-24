import { memo, useMemo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { handleCollect, handlePlay } from './listAction'
import songlistState from '@/store/songlist/state'
import listState from '@/store/list/state'
import { useI18n } from '@/lang'
import { useListInfo } from './state'
import { colors } from '@/theme/tokens'

export default memo(() => {
  const t = useI18n()
  const info = useListInfo()
  const listId = `${info.source}__${info.id}`
  const isCollected = useMemo(() => {
    return listState.userList.some(l => l.sourceListId === listId)
  }, [listId, listState.userList])

  const songCount = songlistState.listDetailInfo.list.length || (info as any).total || 0

  const handlePlayAll = () => {
    void handlePlay(info.id, info.source, songlistState.listDetailInfo.list)
  }

  const handleCollection = () => {
    void handleCollect(info.id, info.source, songlistState.listDetailInfo.info.name || info.name)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, styles.playAllBtn]}
        activeOpacity={0.8}
        onPress={handlePlayAll}
      >
        <Icon name="play" size={14} color="#FFFFFF" />
        <Text style={styles.playAllText}>
          {t('play_all')}
          {songCount ? ` (${songCount})` : ''}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.btn,
          styles.collectBtn,
          isCollected && styles.collectedBtn,
        ]}
        activeOpacity={0.8}
        onPress={handleCollection}
      >
        <Icon
          name="love"
          size={14}
          color={isCollected ? '#E0245E' : colors.inkSecondary}
        />
        <Text style={[styles.collectText, isCollected && styles.collectedText]}>
          {isCollected ? '已收藏' : t('collect_songlist')}
        </Text>
      </TouchableOpacity>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 12,
  },
  btn: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  playAllBtn: {
    flex: 1.4,
    backgroundColor: colors.brand,
    paddingHorizontal: 14,
    marginRight: 10,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  playAllText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  collectBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
  },
  collectedBtn: {
    backgroundColor: '#FDECEC',
  },
  collectText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginLeft: 5,
  },
  collectedText: {
    color: '#E0245E',
  },
})
