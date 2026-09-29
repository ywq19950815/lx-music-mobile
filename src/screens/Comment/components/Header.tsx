import { memo } from 'react'
import { View, StyleSheet } from 'react-native'

import StatusBar from '@/components/common/StatusBar'
import { useStatusbarHeight } from '@/store/common/hook'
import Text from '@/components/common/Text'

/**
 * 评论页头部（极简：无返回按钮，返回交给系统手势/返回键）。
 */
export default memo(({ musicInfo }: {
  musicInfo: LX.Music.MusicInfo
}) => {
  const statusBarHeight = useStatusbarHeight()

  return (
    <View style={[styles.root, { height: 52 + statusBarHeight, paddingTop: statusBarHeight }]}>
      <StatusBar />
      <View style={styles.container}>
        <View style={styles.center}>
          <Text numberOfLines={1} style={styles.mainTitle}>歌曲评论</Text>
          <Text numberOfLines={1} style={styles.subTitle}>
            《{musicInfo.name}》{musicInfo.singer ? ` · ${musicInfo.singer}` : ''}
          </Text>
        </View>
      </View>
    </View>
  )
})


const styles = StyleSheet.create({
  root: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
})
