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
  onShowListMenu: (listInfo: LX.List.MyListInfo, position: { x: number, y: number, w: number, h: number }) => void
}

/**
 * Tab 4 我的音乐 - 现代商业级资产大盘
 * 包含：用户资产卡片、四大金刚入口（我喜欢/试听/最近/本地）、我的歌单卡片列表
 */
export default memo(({ onSelectList, onCreateList, onImportList, onShowListMenu }: DashboardProps) => {
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
      {/* 1. 顶部个人资产尊享卡片 */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Icon name="logo" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.vipBadge}>
            <Text style={styles.vipBadgeText}>VIP</Text>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.profileName} numberOfLines={1}>我的音乐空间</Text>
            <View style={styles.hifiTag}>
              <Text style={styles.hifiText}>Hi-Fi</Text>
            </View>
          </View>
          <Text style={styles.profileSubtitle}>
            已收纳 {totalMusics} 首歌曲 · {allList.length} 个专属歌单
          </Text>
        </View>
      </View>

      {/* 2. 四大金刚核心资产区（2x2 大方块矩阵） */}
      <View style={styles.quickGrid}>
        {/* 卡片 1：我喜欢 */}
        <TouchableOpacity
          style={[styles.gridCard, styles.cardLove]}
          activeOpacity={0.8}
          onPress={() => {
            setActiveList(LIST_IDS.LOVE)
            onSelectList(LIST_IDS.LOVE)
          }}
        >
          <View style={styles.gridHeader}>
            <View style={[styles.gridIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Icon name="love" size={18} color="#EF4444" />
            </View>
            <View style={[styles.miniPlayBtn, { backgroundColor: '#FEE2E2' }]}>
              <Icon name="play" size={11} color="#EF4444" />
            </View>
          </View>
          <Text style={styles.gridCardTitle}>我喜欢</Text>
          <Text style={styles.gridCardSub}>{loveCount} 首歌曲</Text>
        </TouchableOpacity>

        {/* 卡片 2：试听列表 */}
        <TouchableOpacity
          style={[styles.gridCard, styles.cardDefault]}
          activeOpacity={0.8}
          onPress={() => {
            setActiveList(LIST_IDS.DEFAULT)
            onSelectList(LIST_IDS.DEFAULT)
          }}
        >
          <View style={styles.gridHeader}>
            <View style={[styles.gridIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="play" size={17} color="#D97706" />
            </View>
            <View style={[styles.miniPlayBtn, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="chevron-right" size={12} color="#D97706" />
            </View>
          </View>
          <Text style={styles.gridCardTitle}>试听列表</Text>
          <Text style={styles.gridCardSub}>{defaultCount} 首歌曲</Text>
        </TouchableOpacity>

        {/* 卡片 3：最近播放 */}
        <TouchableOpacity
          style={[styles.gridCard, styles.cardRecent]}
          activeOpacity={0.8}
          onPress={() => {
            setActiveList(LIST_IDS.DEFAULT)
            onSelectList(LIST_IDS.DEFAULT)
          }}
        >
          <View style={styles.gridHeader}>
            <View style={[styles.gridIconWrap, { backgroundColor: '#E0E7FF' }]}>
              <Icon name="music_time" size={18} color="#4F46E5" />
            </View>
          </View>
          <Text style={styles.gridCardTitle}>最近播放</Text>
          <Text style={styles.gridCardSub}>快捷续听 · 沉浸回顾</Text>
        </TouchableOpacity>

        {/* 卡片 4：本地与离线 */}
        <TouchableOpacity
          style={[styles.gridCard, styles.cardLocal]}
          activeOpacity={0.8}
          onPress={() => {
            setActiveList(LIST_IDS.DEFAULT)
            onSelectList(LIST_IDS.DEFAULT)
          }}
        >
          <View style={styles.gridHeader}>
            <View style={[styles.gridIconWrap, { backgroundColor: '#D1FAE5' }]}>
              <Icon name="download-2" size={18} color="#059669" />
            </View>
          </View>
          <Text style={styles.gridCardTitle}>本地与缓存</Text>
          <Text style={styles.gridCardSub}>设备离线 · 极速畅听</Text>
        </TouchableOpacity>
      </View>

      {/* 3. 我的自建歌单专区 */}
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
  // 个人资产卡
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
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1C20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: colors.brand,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vipBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  hifiTag: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  hifiText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B36B00',
  },
  profileSubtitle: {
    fontSize: 12,
    color: colors.inkSecondary,
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
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
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
    backgroundColor: '#F5A623',
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
})
