import { memo, useEffect, useState, useMemo, useCallback } from 'react'
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useMyList } from '@/store/list/hook'
import { setActiveList } from '@/core/list'
import { getListMusics } from '@/utils/listManage'
import { colors, radius } from '@/theme/tokens'
import { LIST_IDS } from '@/config/constant'
import { toast } from '@/utils/tools'
import { getLocalMusics } from '@/utils/localMusic'
import { getFollowSingers, saveFollowSingers, type FollowSinger } from '@/utils/data'
import { setSearchText } from '@/core/search/music'
import { setNavActiveId } from '@/core/common'

export interface DashboardProps {
  onSelectList: (listId: string) => void
  onCreateList: () => void
  onImportList: () => void
  onOpenSetting: () => void
  onOpenLocalDownload: () => void
  onShowListMenu: (listInfo: LX.List.MyListInfo, position: { x: number, y: number, w: number, h: number }) => void
}

// 推荐热门歌手预设
const POPULAR_SINGERS = [
  '周杰伦',
  '陈奕迅',
  '林俊杰',
  '邓紫棋',
  '王菲',
  '薛之谦',
  '毛不易',
  '李荣浩',
  '五月天',
  '张学友',
]

/**
 * 个人音乐中心（全新对标 QQ 音乐重塑版）：
 * 1. 顶栏：MY MUSIC PROFILE + 通知/设置微按钮
 * 2. 用户资产卡片：精致头像光圈 + 全局收录资产统计
 * 3. 核心金刚区：本地下载（真实统计与专属入口）/ 最近播放 / 我喜欢 / 音效设置
 * 4. 音乐资产专区（彻底解决不协调）：
 *    - 宽敞开阔的三等分分段 Tab 栏（自建歌单 / 收藏歌单 / 关注歌手，各带数量徽标）
 *    - 专属次级操作栏：新建与导入按钮优雅平衡对称，不再硬挤在 Tab 同一行
 *    - 100% 真实落地的收藏歌单流与关注歌手流（支持作品速查与本地持久化）
 */
export default memo(({
  onSelectList,
  onCreateList,
  onImportList,
  onOpenSetting,
  onOpenLocalDownload,
  onShowListMenu,
}: DashboardProps) => {
  const allList = useMyList()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [localCount, setLocalCount] = useState<number>(0)
  const [listTab, setListTab] = useState<'self' | 'fav' | 'follow'>('self')
  const [followSingers, setFollowSingers] = useState<FollowSinger[]>([])

  // 添加关注歌手弹窗状态
  const [showAddSingerModal, setShowAddSingerModal] = useState(false)
  const [newSingerName, setNewSingerName] = useState('')

  // 统计各歌单歌曲数与本地歌曲数
  const loadCounts = useCallback(async() => {
    const newCounts: Record<string, number> = {}
    for (const item of allList) {
      try {
        const musics = await getListMusics(item.id)
        newCounts[item.id] = musics.length
      } catch {
        newCounts[item.id] = 0
      }
    }
    setCounts(newCounts)

    try {
      const localList = await getLocalMusics()
      setLocalCount(localList.length)
    } catch {
      setLocalCount(0)
    }
  }, [allList])

  // 加载关注歌手
  const loadFollowSingers = useCallback(async() => {
    try {
      const singers = await getFollowSingers()
      setFollowSingers(singers)
    } catch {
      setFollowSingers([])
    }
  }, [])

  useEffect(() => {
    void loadCounts()
    void loadFollowSingers()

    global.app_event.on('myListMusicUpdate', loadCounts)
    global.app_event.on('downloadListUpdate', loadCounts)
    return () => {
      global.app_event.off('myListMusicUpdate', loadCounts)
      global.app_event.off('downloadListUpdate', loadCounts)
    }
  }, [loadCounts, loadFollowSingers])

  // 资产统计
  const loveCount = counts[LIST_IDS.LOVE] ?? 0
  const defaultCount = counts[LIST_IDS.DEFAULT] ?? 0
  const totalMusics = useMemo(() => {
    return Object.values(counts).reduce((acc, c) => acc + c, 0) + localCount
  }, [counts, localCount])

  // 用户自建歌单（排除 default 与 love，且排除有外部 source 的歌单）
  const selfLists = useMemo(() => {
    return allList.filter(l => l.id !== LIST_IDS.DEFAULT && l.id !== LIST_IDS.LOVE && !('source' in l && l.source))
  }, [allList])

  // 收藏的外部在线歌单（具有 source 属性）
  const favLists = useMemo(() => {
    return allList.filter(l => l.id !== LIST_IDS.DEFAULT && l.id !== LIST_IDS.LOVE && ('source' in l && !!l.source)) as LX.List.UserListInfo[]
  }, [allList])

  const handlePlayLove = useCallback(() => {
    setActiveList(LIST_IDS.LOVE)
    onSelectList(LIST_IDS.LOVE)
  }, [onSelectList])

  // 关注歌手操作
  const handleFollowSinger = useCallback(async(name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (followSingers.some(s => s.name === trimmed)) {
      toast(`已经关注过歌手：${trimmed}`)
      return
    }
    const newSinger: FollowSinger = {
      id: `singer_${Date.now()}`,
      name: trimmed,
      followTime: Date.now(),
    }
    const updated = [newSinger, ...followSingers]
    await saveFollowSingers(updated)
    setFollowSingers(updated)
    toast(`已成功关注歌手：${trimmed}`)
    setNewSingerName('')
    setShowAddSingerModal(false)
  }, [followSingers])

  // 取消关注歌手
  const handleUnfollowSinger = useCallback(async(id: string, name: string) => {
    const updated = followSingers.filter(s => s.id !== id)
    await saveFollowSingers(updated)
    setFollowSingers(updated)
    toast(`已取消关注歌手：${name}`)
  }, [followSingers])

  // 点击歌手直达单曲检索听歌
  const handleGoSingerSongs = useCallback((name: string) => {
    setSearchText(name)
    setNavActiveId('nav_search')
  }, [])

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. MY MUSIC PROFILE 顶栏 ─────────────── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.topBarLabel}>MY MUSIC PROFILE</Text>
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.topCircleBtn}
            activeOpacity={0.7}
            onPress={() => { toast('暂无新通知') }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Icon name="comment" size={16} color={colors.brand} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topCircleBtn}
            activeOpacity={0.7}
            onPress={onOpenSetting}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
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
            <Text style={styles.profileName} numberOfLines={1}>我的音乐</Text>
            <Text style={styles.profileSub}>
              {totalMusics} 首好歌 · {allList.length} 个歌单 · {followSingers.length} 位关注歌手
            </Text>
          </View>
        </View>
      </View>

      {/* ── 3. 快捷入口四宫格 ────────────────────── */}
      <View style={styles.quickGrid}>
        {/* 本地下载（真功能落地） */}
        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.8}
          onPress={onOpenLocalDownload}
        >
          <View style={styles.quickIconCircle}>
            <Icon name="download-2" size={18} color={colors.brand} />
          </View>
          <Text style={styles.quickTitle} numberOfLines={1}>本地下载</Text>
          <Text style={styles.quickSub}>
            {localCount > 0 ? `${localCount} 首` : '离线畅听'}
          </Text>
        </TouchableOpacity>

        {/* 最近播放 */}
        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.8}
          onPress={() => {
            setActiveList(LIST_IDS.DEFAULT)
            onSelectList(LIST_IDS.DEFAULT)
          }}
        >
          <View style={styles.quickIconCircle}>
            <Icon name="music_time" size={18} color={colors.brand} />
          </View>
          <Text style={styles.quickTitle} numberOfLines={1}>最近播放</Text>
          <Text style={styles.quickSub}>{defaultCount} 首</Text>
        </TouchableOpacity>

        {/* 我喜欢 */}
        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.8}
          onPress={handlePlayLove}
        >
          <View style={styles.quickIconCircle}>
            <Icon name="love" size={18} color={colors.brand} />
          </View>
          <Text style={styles.quickTitle} numberOfLines={1}>我喜欢</Text>
          <Text style={styles.quickSub}>{loveCount} 首</Text>
        </TouchableOpacity>

        {/* 音效与设置 */}
        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.8}
          onPress={onOpenSetting}
        >
          <View style={styles.quickIconCircle}>
            <Icon name="setting" size={18} color={colors.brand} />
          </View>
          <Text style={styles.quickTitle} numberOfLines={1}>偏好设置</Text>
          <Text style={styles.quickSub}>音质与服务</Text>
        </TouchableOpacity>
      </View>

      {/* ── 4. 音乐资产专区（彻底重塑，布局极致协调） ─ */}
      <View style={styles.playlistSection}>
        {/* 4.1 独立宽敞的三段式 Tab 栏 */}
        <View style={styles.segmentedTabsContainer}>
          <TouchableOpacity
            style={[styles.segmentedTabItem, listTab === 'self' && styles.segmentedTabItemActive]}
            activeOpacity={0.7}
            onPress={() => setListTab('self')}
          >
            <Text style={[styles.segmentedTabText, listTab === 'self' && styles.segmentedTabTextActive]}>
              自建歌单
            </Text>
            <View style={[styles.tabBadge, listTab === 'self' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, listTab === 'self' && styles.tabBadgeTextActive]}>
                {selfLists.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentedTabItem, listTab === 'fav' && styles.segmentedTabItemActive]}
            activeOpacity={0.7}
            onPress={() => setListTab('fav')}
          >
            <Text style={[styles.segmentedTabText, listTab === 'fav' && styles.segmentedTabTextActive]}>
              收藏歌单
            </Text>
            <View style={[styles.tabBadge, listTab === 'fav' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, listTab === 'fav' && styles.tabBadgeTextActive]}>
                {favLists.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentedTabItem, listTab === 'follow' && styles.segmentedTabItemActive]}
            activeOpacity={0.7}
            onPress={() => setListTab('follow')}
          >
            <Text style={[styles.segmentedTabText, listTab === 'follow' && styles.segmentedTabTextActive]}>
              关注歌手
            </Text>
            <View style={[styles.tabBadge, listTab === 'follow' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, listTab === 'follow' && styles.tabBadgeTextActive]}>
                {followSingers.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 4.2 专属次级操作与状态行（避免所有按钮挤在同一行） */}
        <View style={styles.subActionRow}>
          {listTab === 'self' ? (
            <>
              <Text style={styles.subActionSummary}>
                共 {selfLists.length} 个自建歌单
              </Text>
              <View style={styles.subActionButtons}>
                <TouchableOpacity
                  style={[styles.actionCapsule, styles.actionCapsulePrimary]}
                  onPress={onCreateList}
                  activeOpacity={0.7}
                >
                  <Icon name="add_folder" size={13} color="#FFFFFF" />
                  <Text style={styles.actionCapsuleTextPrimary}>新建歌单</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionCapsule}
                  onPress={onImportList}
                  activeOpacity={0.7}
                >
                  <Icon name="add-music" size={13} color={colors.inkSecondary} />
                  <Text style={styles.actionCapsuleText}>导入</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : listTab === 'fav' ? (
            <>
              <Text style={styles.subActionSummary}>
                共 {favLists.length} 个收藏歌单
              </Text>
              <View style={styles.subActionButtons}>
                <TouchableOpacity
                  style={[styles.actionCapsule, styles.actionCapsulePrimary]}
                  onPress={onImportList}
                  activeOpacity={0.7}
                >
                  <Icon name="download-2" size={13} color="#FFFFFF" />
                  <Text style={styles.actionCapsuleTextPrimary}>导入歌单</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.subActionSummary}>
                已关注 {followSingers.length} 位歌手
              </Text>
              <View style={styles.subActionButtons}>
                <TouchableOpacity
                  style={[styles.actionCapsule, styles.actionCapsulePrimary]}
                  onPress={() => setShowAddSingerModal(true)}
                  activeOpacity={0.7}
                >
                  <Icon name="add-music" size={13} color="#FFFFFF" />
                  <Text style={styles.actionCapsuleTextPrimary}>关注歌手</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* 4.3 内容流展示 */}
        {listTab === 'self' ? (
          <>
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
            {selfLists.length === 0 ? (
              <TouchableOpacity style={styles.emptyPlaylistCard} onPress={onCreateList} activeOpacity={0.8}>
                <View style={styles.emptyIconCircle}>
                  <Icon name="add_folder" size={22} color={colors.brand} />
                </View>
                <Text style={styles.emptyTitle}>创建你的第一个专属歌单</Text>
                <Text style={styles.emptySubtitle}>收集好音乐，打造专属听歌品味</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.userListContainer}>
                {selfLists.map((item) => {
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
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="dots-vertical" size={16} color={colors.inkTertiary} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </>
        ) : listTab === 'fav' ? (
          /* 收藏歌单内容流 */
          favLists.length === 0 ? (
            <TouchableOpacity style={styles.emptyPlaylistCard} onPress={onImportList} activeOpacity={0.8}>
              <View style={styles.emptyIconCircle}>
                <Icon name="download-2" size={22} color={colors.brand} />
              </View>
              <Text style={styles.emptyTitle}>暂无收藏的在线歌单</Text>
              <Text style={styles.emptySubtitle}>支持导入各大主流平台歌单，一键同步收听</Text>
              <View style={styles.emptyImportBtn}>
                <Text style={styles.emptyImportBtnText}>导入外部歌单</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.userListContainer}>
              {favLists.map((item) => {
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
                    <View style={[styles.playlistCover, styles.favPlaylistCover]}>
                      <Icon name="album" size={22} color="#FFFFFF" />
                    </View>

                    <View style={styles.playlistInfo}>
                      <View style={styles.favTitleRow}>
                        <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                        {item.source ? (
                          <View style={styles.sourceBadge}>
                            <Text style={styles.sourceBadgeText}>{item.source.toUpperCase()}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.playlistDetail}>{count} 首歌曲 · 收藏歌单</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.moreBtn}
                      activeOpacity={0.6}
                      onPress={(e) => {
                        const { pageX, pageY } = e.nativeEvent
                        onShowListMenu(item, { x: Math.round(pageX), y: Math.round(pageY), w: 30, h: 30 })
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="dots-vertical" size={16} color={colors.inkTertiary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )
              })}
            </View>
          )
        ) : (
          /* 关注歌手内容流 */
          <View style={styles.singerSection}>
            {/* 已关注歌手列表 */}
            {followSingers.length > 0 ? (
              <View style={styles.singerList}>
                {followSingers.map((singer) => (
                  <View key={singer.id} style={styles.singerCard}>
                    <View style={styles.singerAvatar}>
                      <Icon name="author" size={18} color={colors.brand} />
                    </View>
                    <View style={styles.singerInfo}>
                      <Text style={styles.singerName} numberOfLines={1}>{singer.name}</Text>
                      <Text style={styles.singerSub}>已关注歌手</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.singerPlayBtn}
                      activeOpacity={0.7}
                      onPress={() => handleGoSingerSongs(singer.name)}
                    >
                      <Icon name="play" size={12} color={colors.brand} />
                      <Text style={styles.singerPlayBtnText}>作品</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.singerUnfollowBtn}
                      activeOpacity={0.6}
                      onPress={() => handleUnfollowSinger(singer.id, singer.name)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="close" size={13} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}

            {/* 热门歌手推荐墙 */}
            <View style={styles.popularWallCard}>
              <View style={styles.popularWallHeader}>
                <Icon name="stars" size={15} color={colors.brand} />
                <Text style={styles.popularWallTitle}>
                  {followSingers.length === 0 ? '推荐歌手 · 快速关注' : '探索更多热门歌手'}
                </Text>
              </View>
              <View style={styles.popularChipsContainer}>
                {POPULAR_SINGERS.map((name) => {
                  const isFollowed = followSingers.some(s => s.name === name)
                  return (
                    <TouchableOpacity
                      key={name}
                      style={[styles.popularChip, isFollowed && styles.popularChipFollowed]}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (isFollowed) {
                          handleGoSingerSongs(name)
                        } else {
                          void handleFollowSinger(name)
                        }
                      }}
                    >
                      <Text style={[styles.popularChipText, isFollowed && styles.popularChipTextFollowed]}>
                        {name}
                      </Text>
                      <Icon
                        name={isFollowed ? 'play' : 'add-music'}
                        size={11}
                        color={isFollowed ? colors.brand : colors.inkTertiary}
                      />
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── 5. 添加关注歌手弹窗 ────────────────── */}
      <Modal
        visible={showAddSingerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddSingerModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAddSingerModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalDialog}>
                <Text style={styles.modalTitle}>关注歌手</Text>
                <Text style={styles.modalSub}>输入歌手名字，随时快捷直达TA的音乐作品</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="请输入歌手名字（如：周杰伦）"
                  placeholderTextColor="#94A3B8"
                  value={newSingerName}
                  onChangeText={setNewSingerName}
                  autoFocus
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowAddSingerModal(false)}
                  >
                    <Text style={styles.modalCancelText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmBtn}
                    onPress={() => handleFollowSinger(newSingerName)}
                  >
                    <Text style={styles.modalConfirmText}>确认关注</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
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
  topBarLeft: {
    flex: 1,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  // ── 2. 用户信息卡 ────────────────────────
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: colors.brand,
    padding: 2,
    marginRight: 12,
  },
  avatarCircle: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  profileSub: {
    fontSize: 11.5,
    color: colors.inkSecondary,
    marginTop: 3,
  },

  // ── 3. 快捷四宫格 ────────────────────────
  quickGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    gap: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  quickIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(49, 194, 124, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
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

  // ── 4. 音乐资产专区 ──────────────────────
  playlistSection: {
    marginBottom: 24,
  },

  // 4.1 分段控制器 Tab 栏
  segmentedTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  segmentedTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
    gap: 4,
  },
  segmentedTabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentedTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  segmentedTabTextActive: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.brand,
  },
  tabBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(49, 194, 124, 0.15)',
  },
  tabBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.inkTertiary,
  },
  tabBadgeTextActive: {
    color: colors.brand,
  },

  // 4.2 次级操作行
  subActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  subActionSummary: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  subActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  actionCapsulePrimary: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  actionCapsuleText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.ink,
  },
  actionCapsuleTextPrimary: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 4.3 我喜欢大卡
  loveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  loveCover: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  loveCoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  loveInfo: {
    flex: 1,
    minWidth: 0,
  },
  loveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loveTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
  },
  loveBadge: {
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  loveBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.brand,
  },
  loveSub: {
    fontSize: 11,
    color: colors.inkSecondary,
    marginTop: 3,
  },
  lovePlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(49, 194, 124, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 4.4 歌单列表
  userListContainer: {
    gap: 8,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  playlistCover: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favPlaylistCover: {
    backgroundColor: '#3B82F6',
  },
  playlistInfo: {
    flex: 1,
    minWidth: 0,
  },
  favTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sourceBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  sourceBadgeText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#3B82F6',
  },
  playlistName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  playlistDetail: {
    fontSize: 11,
    color: colors.inkTertiary,
  },
  moreBtn: {
    padding: 6,
  },

  // 空态卡片
  emptyPlaylistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(49, 194, 124, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11.5,
    color: colors.inkTertiary,
    textAlign: 'center',
  },
  emptyImportBtn: {
    marginTop: 12,
    backgroundColor: colors.brand,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  emptyImportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // 4.5 关注歌手模块
  singerSection: {
    gap: 10,
  },
  singerList: {
    gap: 8,
  },
  singerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  singerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  singerInfo: {
    flex: 1,
    minWidth: 0,
  },
  singerName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.ink,
  },
  singerSub: {
    fontSize: 10.5,
    color: colors.inkTertiary,
    marginTop: 2,
  },
  singerPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(49, 194, 124, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginRight: 8,
  },
  singerPlayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand,
  },
  singerUnfollowBtn: {
    padding: 6,
  },

  // 热门歌手推荐墙
  popularWallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  popularWallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  popularWallTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.ink,
  },
  popularChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  popularChipFollowed: {
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(49, 194, 124, 0.25)',
  },
  popularChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  popularChipTextFollowed: {
    color: colors.brand,
    fontWeight: '700',
  },

  // ── 5. 添加关注弹窗 ──────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: colors.inkSecondary,
    marginBottom: 14,
  },
  modalInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
