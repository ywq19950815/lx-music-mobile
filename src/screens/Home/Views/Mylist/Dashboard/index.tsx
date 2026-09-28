import { memo, useEffect, useState, useMemo } from 'react'
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useMyList } from '@/store/list/hook'
import { setActiveList } from '@/core/list'
import { getListMusics } from '@/utils/listManage'
import { colors, radius } from '@/theme/tokens'
import { LIST_IDS } from '@/config/constant'

export interface DashboardProps {
  onSelectList: (listId: string) => void
  onCreateList: () => void
  onImportList: () => void
  onOpenSetting: () => void
  onShowListMenu: (listInfo: LX.List.MyListInfo, position: { x: number, y: number, w: number, h: number }) => void
}

/**
 * 我的音乐 - 简洁资产大盘
 * 包含：品牌头部（无头像图片）、四大金刚入口、我的歌单卡片列表。
 */
export default memo(({ onSelectList, onCreateList, onImportList, onOpenSetting, onShowListMenu }: DashboardProps) => {
  const allList = useMyList()
  const [counts, setCounts] = useState<Record<string, number>>({})

  // 统计各歌单歌曲数
  useEffect(() => {
    let isMounted = true
    const loadCounts = async () => {
      const newCounts: Record<string, number> = {}
      for (const item of allList) {
        try {
          const musics = await getListMusics(item.id)
          newCounts[item.id] = musics.length
        } catch {
          newCounts[item.id] = 0
        }
      }
      if (isMounted) setCounts(newCounts)
    }

    void loadCounts()
    global.app_event.on('myListMusicUpdate', loadCounts)
    return () => {
      isMounted = false
      global.app_event.off('myListMusicUpdate', loadCounts)
    }
  }, [allList])

  // 我喜欢与试听列表数量
  const loveCount = counts[LIST_IDS.LOVE] ?? 0
  const defaultCount = counts[LIST_IDS.DEFAULT] ?? 0
  const totalMusics = useMemo(() => {
    return Object.values(counts).reduce((acc, c) => acc + c, 0)
  }, [counts])

  // 用户自建歌单（排除 default 与 love）
  const userLists = useMemo(() => {
    return allList.filter(l => l.id !== LIST_IDS.DEFAULT && l.id !== LIST_IDS.LOVE)
  }, [allList])

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* 1. 顶部品牌头部（无头像图片） */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Icon name="logo" size={22} color="#FFFFFF" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName} numberOfLines={1}>我的音乐空间</Text>
          <Text style={styles.profileSubtitle}>
            已收纳 {totalMusics} 首歌曲 · {allList.length} 个歌单
          </Text>
        </View>
        <TouchableOpacity style={styles.settingEntry} activeOpacity={0.7} onPress={onOpenSetting}>
          <Icon name="setting" size={14} color={colors.brand} />
        </TouchableOpacity>
      </View>

      {/* 2. 我喜欢 - 全宽主视觉大卡（红粉渐变，QQ 式主次分明） */}
      <TouchableOpacity
        style={styles.loveHeroCard}
        activeOpacity={0.85}
        onPress={() => {
          setActiveList(LIST_IDS.LOVE)
          onSelectList(LIST_IDS.LOVE)
        }}
      >
        <View style={styles.loveHeroDecor} />
        <View style={styles.loveHeroLeft}>
          <View style={styles.loveHeroIconWrap}>
            <Icon name="love" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.loveHeroInfo}>
            <Text style={styles.loveHeroTitle}>我喜欢</Text>
            <Text style={styles.loveHeroSub}>{loveCount} 首歌曲 · 每一首都是心头好</Text>
          </View>
        </View>
        <View style={styles.loveHeroPlay}>
          <Icon name="play" size={16} color="#E11D48" />
        </View>
      </TouchableOpacity>

      {/* 3. 次级入口三宫格（试听 / 最近播放 / 本地缓存） */}
      <View style={styles.trioRow}>
        <TouchableOpacity
          style={styles.trioCard}
          activeOpacity={0.8}
          onPress={() => {
            setActiveList(LIST_IDS.DEFAULT)
            onSelectList(LIST_IDS.DEFAULT)
          }}
        >
          <View style={[styles.trioIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <Icon name="play" size={16} color="#D97706" />
          </View>
          <Text style={styles.trioTitle} numberOfLines={1}>试听列表</Text>
          <Text style={styles.trioSub}>{defaultCount} 首</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.trioCard}
          activeOpacity={0.8}
          onPress={() => {
            setActiveList(LIST_IDS.DEFAULT)
            onSelectList(LIST_IDS.DEFAULT)
          }}
        >
          <View style={[styles.trioIconWrap, { backgroundColor: '#E0E7FF' }]}>
            <Icon name="music_time" size={16} color="#4F46E5" />
          </View>
          <Text style={styles.trioTitle} numberOfLines={1}>最近播放</Text>
          <Text style={styles.trioSub}>续听回顾</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.trioCard}
          activeOpacity={0.8}
          onPress={() => {
            setActiveList(LIST_IDS.DEFAULT)
            onSelectList(LIST_IDS.DEFAULT)
          }}
        >
          <View style={[styles.trioIconWrap, { backgroundColor: '#D1FAE5' }]}>
            <Icon name="download-2" size={16} color="#059669" />
          </View>
          <Text style={styles.trioTitle} numberOfLines={1}>本地缓存</Text>
          <Text style={styles.trioSub}>离线畅听</Text>
        </TouchableOpacity>
      </View>

      {/* 4. 我的自建歌单专区 */}
      <View style={styles.playlistSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>我的歌单</Text>
            <Text style={styles.sectionCount}>({userLists.length})</Text>
          </View>

          <View style={styles.sectionActionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={onImportList} activeOpacity={0.7}>
              <Icon name="add-music" size={14} color={colors.inkSecondary} />
              <Text style={styles.actionBtnText}>导入</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={onCreateList} activeOpacity={0.7}>
              <Icon name="add_folder" size={14} color="#FFFFFF" />
              <Text style={styles.actionBtnTextPrimary}>新建</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 歌单列表 */}
        {userLists.length === 0 ? (
          <TouchableOpacity style={styles.emptyPlaylistCard} onPress={onCreateList} activeOpacity={0.8}>
            <View style={styles.emptyIconCircle}>
              <Icon name="add_folder" size={24} color={colors.brand} />
            </View>
            <Text style={styles.emptyTitle}>创建你的第一个专属歌单</Text>
            <Text style={styles.emptySubtitle}>收集好音乐，打造专属听歌品味</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.userListContainer}>
            {userLists.map((item) => {
              const count = counts[item.id] ?? 0
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.playlistCard}
                  activeOpacity={0.75}
                  onPress={() => {
                    setActiveList(item.id)
                    onSelectList(item.id)
                  }}
                >
                  <View style={styles.playlistCover}>
                    <Icon name="album" size={24} color="#FFFFFF" />
                  </View>

                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.playlistDetail}>{count} 首歌曲</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.moreBtn}
                    activeOpacity={0.6}
                    onPress={(e) => {
                      const { pageX, pageY } = e.nativeEvent
                      onShowListMenu(item, { x: Math.round(pageX), y: Math.round(pageY), w: 30, h: 30 })
                    }}
                  >
                    <Icon name="dots-vertical" size={16} color={colors.inkTertiary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </View>

    </ScrollView>
  )
})

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  // 我喜欢主视觉大卡
  loveHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F43F5E',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  loveHeroDecor: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  loveHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  loveHeroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  loveHeroInfo: {
    flex: 1,
  },
  loveHeroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  loveHeroSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  loveHeroPlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 次级入口三宫格
  trioRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  trioCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF1',
    alignItems: 'flex-start',
  },
  trioIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  trioTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  trioSub: {
    fontSize: 10.5,
    color: colors.inkTertiary,
  },
  // 个人头部卡片（品牌标识，无头像图片）
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECEEF1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingEntry: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(49, 196, 125, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 12,
    color: colors.inkSecondary,
  },
  avatarEditHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(49, 196, 125, 0.1)',
  },
  avatarEditText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brand,
  },
  // 四大金刚卡片 2x2
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  gridCard: {
    width: '48%',
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEEF1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  cardLove: {
    backgroundColor: '#FFF8F8',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  cardDefault: {
    backgroundColor: '#FFFDF5',
    borderColor: 'rgba(245, 166, 35, 0.2)',
  },
  cardRecent: {
    backgroundColor: '#F8FAFF',
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  cardLocal: {
    backgroundColor: '#F4FDF9',
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPlayBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 3,
  },
  gridCardSub: {
    fontSize: 11,
    color: colors.inkTertiary,
  },
  // 歌单专区
  playlistSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.inkTertiary,
  },
  sectionActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF1',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  actionBtnPrimary: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  actionBtnTextPrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyPlaylistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF1',
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(49, 196, 125, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.inkTertiary,
  },
  userListContainer: {
    gap: 10,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ECEEF1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  playlistCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#31C27C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 3,
  },
  playlistDetail: {
    fontSize: 11,
    color: colors.inkTertiary,
  },
  moreBtn: {
    padding: 8,
  },
  // 头像选择弹窗
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 22,
    paddingHorizontal: 16,
  },
  avatarOption: {
    padding: 4,
  },
  avatarOptionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionActive: {
    borderColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
})
