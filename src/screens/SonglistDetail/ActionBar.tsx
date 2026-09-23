import { memo, useMemo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { handleCollect, handlePlay } from './listAction'
import songlistState from '@/store/songlist/state'
import listState from '@/store/list/state'
import { useI18n } from '@/lang'
import { useListInfo } from './state'
import { neoColors } from '@/theme/neobrutalism'

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
        <Icon name="play" size={14} color={neoColors.black} />
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
          color={isCollected ? '#D81E5B' : neoColors.black}
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
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 2.5, height: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  playAllBtn: {
    flex: 1.5,
    backgroundColor: neoColors.yellow,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  playAllText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#000000',
    marginLeft: 6,
  },
  collectBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
  },
  collectedBtn: {
    backgroundColor: '#FFF0F5',
    borderColor: '#000000',
  },
  collectText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    marginLeft: 5,
  },
  collectedText: {
    color: '#D81E5B',
  },
})
