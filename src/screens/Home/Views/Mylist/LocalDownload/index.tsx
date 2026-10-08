import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { colors, radius } from '@/theme/tokens'
import { getLocalMusics, removeLocalMusic, scanAndAddLocalMusics, clearLocalMusics } from '@/utils/localMusic'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import { toast } from '@/utils/tools'
import ChoosePath, { type ChoosePathType } from '@/components/common/ChoosePath'
import SwipeBackView from '@/components/common/SwipeBackView'
import { useBackHandler } from '@/utils/hooks/useBackHandler'

export interface LocalDownloadProps {
  onBack: () => void
}

/**
 * 本地与下载音乐中心
 * - 真实本地歌曲扫描与管理
 * - 一键扫描设备音频、解析元数据
 * - 离线无损原声播放
 */
export default memo(({ onBack }: LocalDownloadProps) => {
  const [musics, setMusics] = useState<LX.Music.MusicInfoLocal[]>([])
  const [loading, setLoading] = useState(false)
  const choosePathRef = useRef<ChoosePathType>(null)

  useBackHandler(() => {
    onBack()
    return true
  })

  const loadLocalMusics = useCallback(async() => {
    try {
      const list = await getLocalMusics()
      setMusics(list)
    } catch {
      setMusics([])
    }
  }, [])

  useEffect(() => {
    void loadLocalMusics()
    const handleUpdate = () => {
      void loadLocalMusics()
    }
    global.app_event.on('downloadListUpdate', handleUpdate)
    global.app_event.on('myListMusicUpdate', handleUpdate)
    return () => {
      global.app_event.off('downloadListUpdate', handleUpdate)
      global.app_event.off('myListMusicUpdate', handleUpdate)
    }
  }, [loadLocalMusics])

  // 播放单曲
  const handlePlaySong = useCallback((index: number) => {
    void playList(LIST_IDS.DOWNLOAD, index)
  }, [])

  // 播放全部
  const handlePlayAll = useCallback(() => {
    if (!musics.length) {
      toast('暂无本地音乐可播放')
      return
    }
    void playList(LIST_IDS.DOWNLOAD, 0)
    toast(`开始播放全部本地音乐（共 ${musics.length} 首）`)
  }, [musics.length])

  // 打开目录选择器扫描
  const handleStartScan = useCallback(() => {
    choosePathRef.current?.show({
      title: '选择包含音乐的文件夹进行扫描',
      dirOnly: true,
      isPersist: true,
    })
  }, [])

  // 确认扫描指定目录
  const handleConfirmScanPath = useCallback(async(path: string) => {
    if (!path) return
    setLoading(true)
    toast('正在扫描本地音频文件...')
    try {
      const res = await scanAndAddLocalMusics(path)
      if (res.total === 0) {
        toast('该目录下未发现支持的音频文件')
      } else {
        toast(`扫描完成！发现 ${res.total} 个音频，成功导入 ${res.added} 首新歌`)
      }
      await loadLocalMusics()
    } catch (err: any) {
      toast(`扫描失败：${err?.message || '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }, [loadLocalMusics])

  // 单曲移除
  const handleRemoveSong = useCallback((item: LX.Music.MusicInfoLocal) => {
    Alert.alert(
      '移除本地音乐',
      `确定从本地列表中移除《${item.name}》吗？（不会删除本地源文件）`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: async() => {
            await removeLocalMusic(item.meta.filePath)
            toast('已从本地音乐中移除')
            await loadLocalMusics()
          },
        },
      ],
    )
  }, [loadLocalMusics])

  // 清空全部
  const handleClearAll = useCallback(() => {
    if (!musics.length) return
    Alert.alert(
      '清空本地音乐库',
      '确定清空全部本地音乐列表吗？（不会删除手机存储中的源文件）',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: async() => {
            await clearLocalMusics()
            toast('已清空本地音乐库')
            await loadLocalMusics()
          },
        },
      ],
    )
  }, [musics.length, loadLocalMusics])

  const renderItem = useCallback(({ item, index }: { item: LX.Music.MusicInfoLocal, index: number }) => {
    const ext = (item.meta.ext || 'MP3').toUpperCase()
    return (
      <TouchableOpacity
        style={styles.songItem}
        activeOpacity={0.7}
        onPress={() => handlePlaySong(index)}
      >
        <View style={styles.indexBox}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>

        <View style={styles.songMain}>
          <Text style={styles.songName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.songSubRow}>
            <View style={styles.extBadge}>
              <Text style={styles.extBadgeText}>{ext}</Text>
            </View>
            <Text style={styles.singerName} numberOfLines={1}>{item.singer || '本地音频'}</Text>
            {item.interval ? <Text style={styles.intervalText}>· {item.interval}</Text> : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.moreActionBtn}
          activeOpacity={0.6}
          onPress={() => handleRemoveSong(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="close" size={15} color={colors.inkTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }, [handlePlaySong, handleRemoveSong])

  return (
    <SwipeBackView onBack={onBack}>
      <View style={styles.container}>
        {/* ── 1. 一体化顶栏 ───────────────────────────── */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.navBackBtn}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="chevron-left" size={18} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.navCenter}>
            <Text style={styles.navTitle} numberOfLines={1}>本地与下载</Text>
          </View>
          {musics.length > 0 ? (
            <TouchableOpacity
              style={styles.navRightBtn}
              activeOpacity={0.7}
              onPress={handleClearAll}
            >
              <Text style={styles.navRightText}>清空</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.navPlaceholder} />
          )}
        </View>

        {/* ── 2. 状态资产 Hero 卡片 ───────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroIconBox}>
              <Icon name="download-2" size={24} color={colors.brand} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroTitle}>本地音乐库</Text>
              <Text style={styles.heroSub}>
                已收录 {musics.length} 首 · 支持无损格式与全场景离线畅听
              </Text>
            </View>
          </View>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.heroBtn, styles.heroBtnPrimary, musics.length === 0 && styles.heroBtnDisabled]}
              activeOpacity={0.8}
              onPress={handlePlayAll}
              disabled={musics.length === 0}
            >
              <Icon name="play" size={15} color="#FFFFFF" />
              <Text style={styles.heroBtnTextPrimary}>播放全部</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.heroBtn, styles.heroBtnSecondary]}
              activeOpacity={0.8}
              onPress={handleStartScan}
            >
              <Icon name="search-2" size={15} color={colors.brand} />
              <Text style={styles.heroBtnTextSecondary}>扫描本地文件夹</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 3. 歌曲列表 / 空状态 ────────────────────── */}
        {musics.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="album" size={32} color={colors.brand} />
            </View>
            <Text style={styles.emptyTitle}>暂无本地与下载歌曲</Text>
            <Text style={styles.emptyDesc}>
              扫描设备存储中的音乐文件，即可收录至本地乐库，无需网络即享无损音质
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              activeOpacity={0.8}
              onPress={handleStartScan}
            >
              <Icon name="search-2" size={16} color="#FFFFFF" />
              <Text style={styles.emptyActionText}>立即扫描手机音乐</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={musics}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* 目录选择弹层 */}
        <ChoosePath ref={choosePathRef} onConfirm={handleConfirmScanPath} />
      </View>
    </SwipeBackView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // 顶栏
  navBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  navBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPlaceholder: {
    width: 34,
  },
  navRightBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  navRightText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },

  // Hero 卡片
  heroCard: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  heroSub: {
    fontSize: 11.5,
    color: colors.inkSecondary,
    marginTop: 2,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroBtn: {
    flex: 1,
    height: 38,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroBtnPrimary: {
    backgroundColor: colors.brand,
  },
  heroBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  heroBtnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  heroBtnSecondary: {
    backgroundColor: 'rgba(49, 194, 124, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(49, 194, 124, 0.25)',
  },
  heroBtnTextSecondary: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: '700',
  },

  // 歌曲列表
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 28,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  indexBox: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkTertiary,
  },
  songMain: {
    flex: 1,
    minWidth: 0,
  },
  songName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 3,
  },
  songSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  extBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
  },
  extBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.brand,
  },
  singerName: {
    fontSize: 11.5,
    color: colors.inkSecondary,
    maxWidth: 150,
  },
  intervalText: {
    fontSize: 11,
    color: colors.inkTertiary,
  },
  moreActionBtn: {
    padding: 6,
    marginLeft: 6,
  },

  // 空状态
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(49, 194, 124, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12.5,
    color: colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: radius.pill,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
})
