import { memo, useState } from 'react'
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import commonActions from '@/store/common/action'
import { colors, radius } from '@/theme/tokens'
import { saveSearchSetting } from '@/utils/data'
import { toast } from '@/utils/tools'

export interface DiscoverHomeProps {
  onSearch: (keyword: string) => void
}

// 顶部内容导航 Tab（「音乐馆」跳转二级 Tab，其余触发关键词搜索）
const NAV_TABS = [
  { key: 'recommend', label: '推荐', keyword: '' },
  { key: 'musichall', label: '音乐馆', keyword: '' },
  { key: 'cyber', label: '赛博电音', keyword: '电音' },
  { key: 'pop', label: '流行榜', keyword: '流行' },
  { key: 'lossless', label: '无损专区', keyword: '无损' },
  { key: 'podcast', label: '播客电台', keyword: '播客' },
] as const

// 精选歌单（真实高清封面与播放量）
const RECOMMENDED_PLAYLISTS = [
  {
    id: 'rec_1',
    name: '国风热歌来袭 | 100首诗意旋律',
    playCount: '328万',
    bg: '#C2410C',
    img: 'https://p1.music.126.net/6y-UleORITEDbvrOLAL-vQ==/109951167436391480.jpg?param=300y300',
  },
  {
    id: 'rec_2',
    name: '欧美流行热播：洗脑旋律循环不停',
    playCount: '245万',
    bg: '#1D4ED8',
    img: 'https://p2.music.126.net/v7_32p-4H_9fW71nJ3uB9A==/109951168536340245.jpg?param=300y300',
  },
  {
    id: 'rec_3',
    name: '伤感治愈：眼泪留不住要走的心',
    playCount: '198万',
    bg: '#B91C1C',
    img: 'https://p1.music.126.net/rKSmg661Y63z2v1D1qWb4A==/109951166702962131.jpg?param=300y300',
  },
  {
    id: 'rec_4',
    name: '华语R&B • 撩拨耳畔的浪漫旖思',
    playCount: '156万',
    bg: '#6D28D9',
    img: 'https://p1.music.126.net/79VqK3c8uV2UvQ6P244E3g==/109951165434199923.jpg?param=300y300',
  },
  {
    id: 'rec_5',
    name: '车载慢摇：重低音夜行公路必听',
    playCount: '142万',
    bg: '#0F766E',
    img: 'https://p1.music.126.net/K7N5V6f6eD-3BqJ4fRz-8g==/109951165387431189.jpg?param=300y300',
  },
  {
    id: 'rec_6',
    name: '2026 热门歌曲短视频最火排行',
    playCount: '410万',
    bg: '#EA580C',
    img: 'https://p1.music.126.net/5d6o4p-cR83yG7Z5T_lQ9w==/109951165842884210.jpg?param=300y300',
  },
]

// 今日热门 · 随心听（含音质标签）
const HOT_SONGS = [
  { title: '离别开出花', artist: '就是南方凯', tag: '独家' },
  { title: '若月亮没来', artist: '王宇宙 / 乔浚丞', tag: '热播' },
  { title: '暮色回响', artist: '吉星出租', tag: '飙升' },
]

/**
 * Tab 1 发现首页（2026-09-29 设计稿）：
 * - 内容导航 Tab（推荐 / 音乐馆 / …）
 * - 首发超清母带 Hero 大卡
 * - 五大金刚快捷入口（每日推荐 / 歌单广场 / 排行榜 / 电台频道 / AI 作曲）
 * - 为你推荐 · 专属歌单（三列网格）
 * - 今日热门 · 随心听（卡片式歌曲流）
 */
export default memo(({ onSearch }: DiscoverHomeProps) => {
  const [activeTab, setActiveTab] = useState<string>('recommend')

  const handleTabPress = (tab: typeof NAV_TABS[number]) => {
    if (tab.key === 'recommend') {
      setActiveTab('recommend')
      return
    }
    setActiveTab(tab.key)
    if (tab.key === 'musichall') {
      commonActions.setNavActiveId('nav_top')
      return
    }
    if (tab.keyword) {
      onSearch(tab.keyword)
      // 搜索后回到推荐态，避免标签停留在临时筛选
      requestAnimationFrame(() => setActiveTab('recommend'))
    }
  }

  const handleSonglistSquare = () => {
    void saveSearchSetting({ type: 'songlist' }).then(() => {
      global.app_event.searchTypeChanged('songlist')
    })
  }

  const hero = RECOMMENDED_PLAYLISTS[0]

  return (
    <View style={styles.container}>
      {/* ── 1. 内容导航 Tab ───────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.navTabScroll}
        contentContainerStyle={styles.navTabContent}
      >
        {NAV_TABS.map(tab => {
          const active = activeTab === tab.key
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navTabItem}
              activeOpacity={0.7}
              onPress={() => { handleTabPress(tab) }}
            >
              <Text style={[styles.navTabText, active && styles.navTabTextActive]}>
                {tab.label}
              </Text>
              {active ? <View style={styles.navTabIndicator} /> : null}
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* ── 2. 首发超清母带 Hero 大卡 ─────────────── */}
      <View style={styles.heroSection}>
        <TouchableOpacity style={styles.heroCard} activeOpacity={0.85} onPress={() => { onSearch(hero.name.split(' ')[0]) }}>
          <View style={styles.heroCoverBox}>
            <Image url={hero.img} style={styles.heroCover} resizeMode="cover" />
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.heroBadge}>
              <Icon name="sparkles" size={10} color={colors.brand} />
              <Text style={styles.heroBadgeText}>首发超清母带</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={1}>{hero.name.split(' | ')[0].split('：')[0]}</Text>
            <Text style={styles.heroDesc} numberOfLines={2}>沉浸式全景曲库，高品质音质已就绪</Text>
            <View style={styles.heroActionRow}>
              <View style={styles.heroPlayBtn}>
                <Icon name="play" size={12} color="#FFFFFF" />
                <Text style={styles.heroPlayText}>立即播放</Text>
              </View>
              <Text style={styles.heroSource} numberOfLines={1}>精选歌单 · 独家</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── 3. 五大金刚快捷入口 ───────────────────── */}
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickItem} activeOpacity={0.7} onPress={() => { onSearch('每日推荐') }}>
          <View style={styles.quickIconBox}>
            <Icon name="love" size={20} color={colors.brand} />
          </View>
          <Text style={styles.quickLabel}>每日推荐</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickItem} activeOpacity={0.7} onPress={handleSonglistSquare}>
          <View style={styles.quickIconBox}>
            <Icon name="album" size={20} color={colors.brand} />
          </View>
          <Text style={styles.quickLabel}>歌单广场</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickItem} activeOpacity={0.7} onPress={() => { commonActions.setNavActiveId('nav_top') }}>
          <View style={styles.quickIconBox}>
            <Icon name="leaderboard" size={20} color={colors.brand} />
          </View>
          <Text style={[styles.quickLabel, styles.quickLabelStrong]}>排行榜</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickItem} activeOpacity={0.7} onPress={() => { onSearch('电台') }}>
          <View style={styles.quickIconBox}>
            <Icon name="list-random" size={20} color={colors.brand} />
          </View>
          <Text style={styles.quickLabel}>电台频道</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickItem} activeOpacity={0.7} onPress={() => { toast('AI 作曲敬请期待') }}>
          <View style={styles.quickIconBox}>
            <Icon name="logo" size={20} color={colors.brand} />
          </View>
          <Text style={styles.quickLabel}>AI 作曲</Text>
        </TouchableOpacity>
      </View>

      {/* ── 4. 为你推荐 · 专属歌单（三列网格）──────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>为你推荐 · 专属歌单</Text>
            <View style={styles.sectionTag}>
              <Text style={styles.sectionTagText}>智能定制</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreLink} activeOpacity={0.6} onPress={handleSonglistSquare}>
            <Text style={styles.moreText}>更多</Text>
            <Icon name="chevron-right" size={13} color={colors.inkTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.playlistGrid}>
          {RECOMMENDED_PLAYLISTS.slice(0, 6).map(pl => (
            <TouchableOpacity
              key={pl.id}
              style={styles.playlistItem}
              activeOpacity={0.8}
              onPress={() => { onSearch(pl.name.split(' ')[0]) }}
            >
              <View style={[styles.playlistCoverBox, { backgroundColor: pl.bg }]}>
                <Image url={pl.img} style={styles.playlistCover} resizeMode="cover" />
                <View style={styles.playCountBadge}>
                  <Icon name="music_time" size={9} color={colors.brand} />
                  <Text style={styles.playCountText}>{pl.playCount}</Text>
                </View>
              </View>
              <Text style={styles.playlistTitle} numberOfLines={2}>{pl.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── 5. 今日热门 · 随心听 ───────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>今日热门 · 随心听</Text>
          <Text style={styles.sectionSub}>根据听歌偏好生成</Text>
        </View>

        <View style={styles.songList}>
          {HOT_SONGS.map((song, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.songCard, idx === 0 && styles.songCardFeatured]}
              activeOpacity={0.75}
              onPress={() => { onSearch(song.title) }}
            >
              <View style={[styles.songCoverBox, { backgroundColor: ['#0F766E', '#1D4ED8', '#6D28D9'][idx % 3] }]}>
                <Image
                  url={RECOMMENDED_PLAYLISTS[(idx + 2) % RECOMMENDED_PLAYLISTS.length].img}
                  style={styles.songCover}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.songMeta}>
                <View style={styles.songTitleRow}>
                  <Text style={styles.songName} numberOfLines={1}>{song.title}</Text>
                  <View style={styles.songTag}>
                    <Text style={styles.songTagText}>{song.tag}</Text>
                  </View>
                </View>
                <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
              </View>
              <View style={[styles.songPlayBtn, idx === 0 && styles.songPlayBtnFeatured]}>
                <Icon name="play" size={13} color={idx === 0 ? colors.brand : colors.inkSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: 24,
  },

  // ── 1. 内容导航 Tab ──────────────────────
  navTabScroll: {
    flexGrow: 0,
  },
  navTabContent: {
    paddingHorizontal: 20,
    gap: 24,
  },
  navTabItem: {
    alignItems: 'center',
    paddingBottom: 8,
    position: 'relative',
  },
  navTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.inkTertiary,
  },
  navTabTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand,
  },
  navTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.brand,
  },

  // ── 2. Hero 大卡 ─────────────────────────
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  heroCoverBox: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.muted,
  },
  heroCover: {
    width: '100%',
    height: '100%',
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brand,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  heroDesc: {
    fontSize: 12,
    color: colors.inkSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  heroPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 2,
  },
  heroPlayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroSource: {
    flex: 1,
    fontSize: 11,
    color: colors.inkTertiary,
  },

  // ── 3. 五大金刚 ──────────────────────────
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickLabel: {
    fontSize: 11,
    color: colors.inkSecondary,
  },
  quickLabelStrong: {
    fontWeight: '600',
  },

  // ── 4. 专属歌单 ──────────────────────────
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  sectionTag: {
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sectionTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.brand,
  },
  sectionSub: {
    fontSize: 11,
    color: colors.inkTertiary,
  },
  moreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  moreText: {
    fontSize: 12,
    color: colors.inkTertiary,
  },
  playlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  playlistItem: {
    width: '30.5%',
    flexGrow: 1,
  },
  playlistCoverBox: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    position: 'relative',
  },
  playlistCover: {
    width: '100%',
    height: '100%',
  },
  playCountBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  playCountText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  playlistTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.ink,
    lineHeight: 15,
    marginTop: 6,
  },

  // ── 5. 今日热门 ──────────────────────────
  songList: {
    gap: 8,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: 12,
  },
  songCardFeatured: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  songCoverBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.hairline,
    marginRight: 12,
  },
  songCover: {
    width: '100%',
    height: '100%',
  },
  songMeta: {
    flex: 1,
    minWidth: 0,
  },
  songTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  songName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    flexShrink: 1,
  },
  songTag: {
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  songTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.brand,
  },
  songArtist: {
    fontSize: 11,
    color: colors.inkSecondary,
    marginTop: 3,
  },
  songPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  songPlayBtnFeatured: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
})
