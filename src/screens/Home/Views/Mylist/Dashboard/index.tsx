import { memo, useEffect, useState, useMemo } from 'react'
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useMyList } from '@/store/list/hook'
import { setActiveList } from '@/core/list'
import { getListMusics } from '@/utils/listManage'
import { colors, radius } from '@/theme/tokens'
import { LIST_IDS } from '@/config/constant'
import { toast } from '@/utils/tools'

export interface DashboardProps {
  onSelectList: (listId: string) => void
  onCreateList: () => void
  onImportList: () => void
  onOpenSetting: () => void
  onShowListMenu: (listInfo: LX.List.MyListInfo, position: { x: number, y: number, w: number, h: number }) => void
}

/**
 * 个人音乐中心（2026-09-29 设计稿）：
 * - MY MUSIC PROFILE 顶栏（通知 / 设置圆钮）
 * - 用户信息卡：品牌绿描边头像 + Hi-Fi 徽章 + 听歌资产统计 + 尊享特权条
 * - 快捷入口四宫格（本地下载 / 最近播放 / 已购音乐 / 车载互联）
 * - 歌单 Tab（自建歌单 / 收藏歌单 / 关注歌手）
 * - 「我喜欢」心动模式大卡 + 自建歌单卡片流
 */
export default memo(({ onSelectList, onCreateList, onImportList, onOpenSetting, onShowListMenu }: DashboardProps) => {
  const allList = useMyList()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [listTab, setListTab] = useState<'self' | 'fav' | 'follow'>('self')

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

  // 资产统计
  const loveCount = counts[LIST_IDS.LOVE] ?? 0
  const defaultCount = counts[LIST_IDS.DEFAULT] ?? 0
  const totalMusics = useMemo(() => {
    return Object.values(counts).reduce((acc, c) => acc + c, 0)
  }, [counts])

  // 用户自建歌单（排除 default 与 love）
  const userLists = useMemo(() => {
    return allList.filter(l => l.id !== LIST_IDS.DEFAULT && l.id !== LIST_IDS.LOVE)
  }, [allList])

  const handlePlayLove = () => {
    setActiveList(LIST_IDS.LOVE)
    onSelectList(LIST_IDS.LOVE)
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* ── 1. MY MUSIC PROFILE 顶栏 ─────────────── */}
      <View style={styles.topBar}>
        <Text style={styles.topBarLabel}>MY MUSIC PROFILE</Text>
        <View style={styles.topBarActions}>
          <TouchableOpacity style={styles.topCircleBtn} activeOpacity={0.7} onPress={() => { toast('暂无新通知') }}>
            <Icon name="comment" size={16} color={colors.brand} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topCircleBtn} activeOpacity={0.7} onPress={onOpenSetting}>
            <Icon name="setting" size={16} color={colors.brand} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. 用户信息卡 ────────────────────────── */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Icon name="logo" size={26} color={colors.brand} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName} numberOfLines={1}>我的音乐空间</Text>
              <View style={styles.vipBadge}>
                <Text style={styles.vipBadgeText}>Hi-Fi</Text>
              </View>
            </View>
            <Text style={styles.profileSub}>
              已收纳 {totalMusics} 首歌曲 · {allList.length} 个歌单
            </Text>
            <View style={styles.profileStats}>
              <Text style={styles.profileStat}><Text style={styles.profileStatNum}>{loveCount}</Text> 喜欢</Text>
              <Text style={styles.profileStatDivider}>·</Text>
              <Text style={styles.profileStat}><Text style={styles.profileStatNum}>{defaultCount}</Text> 试听</Text>
              <Text style={styles.profileStatDivider}>·</Text>
              <Text style={styles.profileStat}><Text style={styles.profileStatNum}>{totalMusics}</Text> 收藏</Text>
            </View>
          </View>
        </View>

        {/* VIP 特权条 */}
        <View style={styles.privilegeStrip}>
          <View style={styles.privilegeLeft}>
            <Icon name="thumbs-up" size={14} color={colors.brand} />
            <Text style={styles.privilegeText} numberOfLines={1}>尊享 24bit 超清母带音质与黑胶动效</Text>
          </View>
          <TouchableOpacity style={styles.privilegeBtn} activeOpacity={0.7} onPress={onOpenSetting}>
            <Text style={styles.privilegeBtnText}>特权中心</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 3. 快捷入口四宫格 ────────────────────── */}
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.8}
          onPress={() => { toast('本地与下载管理敬请期待') }}
        >
          <Icon name="download-2" size={20} color={colors.brand} />
          <Text style={styles.quickTitle} numberOfLines={1}>本地下载</Text>
          <Text style={styles.quickSub}>离线畅听</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.8}
          onPress={() => {
            setActiveList(LIST_IDS.DEFAULT)
            onSelectList(LIST_IDS.DEFAULT)
          }}
        >
          <Icon name="music_time" size={20} color={colors.brand} />
          <Text style={styles.quickTitle} numberOfLines={1}>最近播放</Text>
          <Text style={styles.quickSub}>{defaultCount} 首</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.8}
          onPress={handlePlayLove}
        >
          <Icon name="love" size={20} color={colors.brand} />
          <Text style={styles.quickTitle} numberOfLines={1}>我喜欢</Text>
          <Text style={styles.quickSub}>{loveCount} 首</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.8}
          onPress={() => { toast('车载互联敬请期待') }}
        >
          <Icon name="list-random" size={20} color={colors.brand} />
          <Text style={styles.quickTitle} numberOfLines={1}>车载互联</Text>
          <Text style={styles.quickSub}>已就绪</Text>
        </TouchableOpacity>
      </View>

      {/* ── 4. 歌单 Tab ──────────────────────────── */}
      <View style={styles.playlistSection}>
        <View style={styles.playlistTabs}>
          <TouchableOpacity
            style={styles.playlistTabItem}
            activeOpacity={0.7}
            onPress={() => { setListTab('self') }}
          >
            <Text style={[styles.playlistTabText, listTab === 'self' && styles.playlistTabTextActive]}>
              自建歌单 ({userLists.length})
            </Text>
            {listTab === 'self' ? <View style={styles.playlistTabIndicator} /> : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playlistTabItem}
            activeOpacity={0.7}
            onPress={() => { toast('收藏歌单敬请期待') }}
          >
            <Text style={styles.playlistTabText}>收藏歌单</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playlistTabItem}
            activeOpacity={0.7}
            onPress={() => { toast('关注歌手敬请期待') }}
          >
            <Text style={styles.playlistTabText}>关注歌手</Text>
          </TouchableOpacity>

          <View style={styles.playlistTabActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onImportList} activeOpacity={0.7}>
              <Icon name="add-music" size={13} color={colors.inkSecondary} />
              <Text style={styles.actionBtnText}>导入</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={onCreateList} activeOpacity={0.7}>
              <Icon name="add_folder" size={13} color="#FFFFFF" />
              <Text style={styles.actionBtnTextPrimary}>新建</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 我喜欢 · 心动模式大卡 */}
        <TouchableOpacity style={styles.loveCard} activeOpacity={0.85} onPress={handlePlayLove}>
          <View style={styles.loveCover}>
            <Icon name="love" size={26} color="#FFFFFF" />
            <View style={styles.loveCoverOverlay} />
          </View>
          <View style={styles.loveInfo}>
            <View style={styles.loveTitleRow}>
              <Text style={styles.loveTitle} numberOfLines={1}>我喜欢</Text>
              <View style={styles.loveBadge}>
                <Text style={styles.loveBadgeText}>心动模式</Text>
              </View>
            </View>
            <Text style={styles.loveSub} numberOfLines={1}>{loveCount} 首 · 每一首都是心头好</Text>
          </View>
          <View style={styles.lovePlayBtn}>
            <Icon name="play" size={15} color={colors.brand} />
          </View>
        </TouchableOpacity>

        {/* 自建歌单卡片流 */}
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
                    <Icon name="album" size={22} color="#FFFFFF" />
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
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // ── 1. 顶栏 ──────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  topBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkTertiary,
    letterSpacing: 1.5,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── 2. 用户信息卡 ────────────────────────
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.brand,
    padding: 2,
    marginRight: 14,
  },
  avatarCircle: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    flexShrink: 1,
  },
  vipBadge: {
    backgroundColor: colors.brand,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  vipBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileSub: {
    fontSize: 11.5,
    color: colors.inkSecondary,
    marginTop: 4,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  profileStat: {
    fontSize: 12,
    color: colors.inkSecondary,
  },
  profileStatNum: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  profileStatDivider: {
    fontSize: 11,
    color: colors.inkTertiary,
  },

  // VIP 特权条
  privilegeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    marginTop: 14,
    paddingTop: 12,
  },
  privilegeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    minWidth: 0,
  },
  privilegeText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.ink,
    flexShrink: 1,
  },
  privilegeBtn: {
    backgroundColor: colors.muted,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  privilegeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brand,
  },

  // ── 3. 快捷四宫格 ────────────────────────
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 5,
  },
  quickTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.ink,
  },
  quickSub: {
    fontSize: 9.5,
    color: colors.inkTertiary,
  },

  // ── 4. 歌单区 ────────────────────────────
  playlistSection: {
    marginBottom: 24,
  },
  playlistTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    marginBottom: 12,
    gap: 20,
  },
  playlistTabItem: {
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  playlistTabText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: colors.inkTertiary,
  },
  playlistTabTextActive: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.brand,
  },
  playlistTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.brand,
  },
  playlistTabActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto',
    marginBottom: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  actionBtnPrimary: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  actionBtnTextPrimary: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 我喜欢大卡
  loveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  loveCover: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  loveCoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loveInfo: {
    flex: 1,
    minWidth: 0,
  },
  loveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  loveTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
  },
  loveBadge: {
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  loveBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.brand,
  },
  loveSub: {
    fontSize: 11,
    color: colors.inkSecondary,
    marginTop: 4,
  },
  lovePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 空态
  emptyPlaylistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
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

  // 自建歌单卡片
  userListContainer: {
    gap: 10,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  playlistCover: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
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
