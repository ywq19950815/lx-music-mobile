import { memo } from 'react'
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import commonActions from '@/store/common/action'
import { colors, radius } from '@/theme/tokens'

export interface DiscoverHomeProps {
  onSearch: (keyword: string) => void
}

// 推荐精选歌单真实高清封面与播放量
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
    img: 'https://p2.music.126.net/rKSmg661Y63z2v1D1qWb4A==/109951166702962131.jpg?param=300y300',
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
    img: 'https://p2.music.126.net/K7N5V6f6eD-3BqJ4fRz-8g==/109951165387431189.jpg?param=300y300',
  },
  {
    id: 'rec_6',
    name: '2026 热门歌曲短视频最火排行',
    playCount: '410万',
    bg: '#EA580C',
    img: 'https://p1.music.126.net/5d6o4p-cR83yG7Z5T_lQ9w==/109951165842884210.jpg?param=300y300',
  },
]

// 今日新歌速递单曲推荐
const NEW_HOT_SONGS = [
  { title: '离别开出花', artist: '就是南方凯', tag: '独家' },
  { title: '若月亮没来', artist: '王宇宙 / 乔浚丞', tag: '热播' },
  { title: '暮色回响', artist: '吉星出租', tag: '飙升' },
]

/**
 * Tab 1 发现首页：QQ 音乐级内容流
 * 包含：5大金刚区快捷入口、精选歌单横向推荐、新歌速递
 */
export default memo(({ onSearch }: DiscoverHomeProps) => {
  return (
    <View style={styles.container}>
      {/* 1. 五大金刚区快捷入口 */}
      <View style={styles.quickNavRow}>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => onSearch('每日推荐')}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#FEE2E2' }]}>
            <Icon name="love" size={18} color="#EF4444" />
          </View>
          <Text style={styles.navLabel}>每日推荐</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => commonActions.setNavActiveId('nav_songlist')}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Icon name="album" size={18} color="#D97706" />
          </View>
          <Text style={styles.navLabel}>歌单广场</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => commonActions.setNavActiveId('nav_top')}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#E0E7FF' }]}>
            <Icon name="leaderboard" size={18} color="#4F46E5" />
          </View>
          <Text style={styles.navLabel}>官方榜单</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => onSearch('周杰伦')}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#D1FAE5' }]}>
            <Icon name="single" size={18} color="#059669" />
          </View>
          <Text style={styles.navLabel}>热门歌手</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => onSearch('车载音乐')}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#FCE7F3' }]}>
            <Icon name="list-random" size={18} color="#DB2777" />
          </View>
          <Text style={styles.navLabel}>随心听</Text>
        </TouchableOpacity>
      </View>

      {/* 2. 精选歌单推荐（横向滑动卡片流） */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>精选歌单推荐</Text>
          <TouchableOpacity activeOpacity={0.6} onPress={() => commonActions.setNavActiveId('nav_songlist')} style={styles.moreLink}>
            <Text style={styles.moreText}>更多</Text>
            <Icon name="chevron-right" size={13} color={colors.inkTertiary} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {RECOMMENDED_PLAYLISTS.map((pl) => (
            <TouchableOpacity
              key={pl.id}
              style={styles.playlistCard}
              activeOpacity={0.8}
              onPress={() => onSearch(pl.name.split(' ')[0])}
            >
              <View style={[styles.coverBox, { backgroundColor: pl.bg }]}>
                {/* 真实高清歌单封面 */}
                <Image
                  url={pl.img}
                  style={styles.coverImage}
                  resizeMode="cover"
                />

                {/* 播放量角标 */}
                <View style={styles.playCountBadge}>
                  <Icon name="play" size={8} color="#FFFFFF" />
                  <Text style={styles.playCountText}>{pl.playCount}</Text>
                </View>

                {/* 右下角播放圆钮 */}
                <View style={styles.playBubble}>
                  <Icon name="play" size={11} color={colors.brand} />
                </View>
              </View>
              <Text style={styles.playlistTitle} numberOfLines={2}>{pl.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. 今日新歌速递单曲推荐 */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>新歌精选速递</Text>
          <TouchableOpacity activeOpacity={0.6} onPress={() => onSearch('新歌速递')} style={styles.moreLink}>
            <Icon name="play" size={11} color={colors.brand} />
            <Text style={[styles.moreText, { color: colors.brand, fontWeight: '700' }]}>全部播放</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.songCardList}>
          {NEW_HOT_SONGS.map((song, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.songItemRow}
              activeOpacity={0.7}
              onPress={() => onSearch(song.title)}
            >
              <View style={styles.songIdxBox}>
                <Text style={styles.songIdxNum}>0{idx + 1}</Text>
              </View>

              <View style={styles.songMeta}>
                <View style={styles.titleLine}>
                  <Text style={styles.songName} numberOfLines={1}>{song.title}</Text>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{song.tag}</Text>
                  </View>
                </View>
                <Text style={styles.artistName} numberOfLines={1}>{song.artist}</Text>
              </View>

              <View style={styles.playBtnWrap}>
                <Icon name="play-outline" size={16} color={colors.inkSecondary} />
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
    paddingTop: 10,
    paddingBottom: 20,
  },
  // 五大金刚区
  quickNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  navItem: {
    alignItems: 'center',
    gap: 6,
  },
  navIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  navLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  // 区块公用
  sectionBlock: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
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
  // 横向歌单流
  horizontalScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  playlistCard: {
    width: 106,
  },
  coverBox: {
    width: 106,
    height: 106,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  playCountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 2,
  },
  playCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playBubble: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 2,
  },
  playlistTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  // 新歌列表
  songCardList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  songItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ECEEF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  songIdxBox: {
    width: 26,
    alignItems: 'center',
  },
  songIdxNum: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkTertiary,
  },
  songMeta: {
    flex: 1,
    marginLeft: 6,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  songName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.ink,
  },
  tagBadge: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B36B00',
  },
  artistName: {
    fontSize: 11.5,
    color: colors.inkTertiary,
  },
  playBtnWrap: {
    padding: 6,
  },
})
