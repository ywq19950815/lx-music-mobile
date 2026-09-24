import { memo, useMemo } from 'react'
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { type BoardItem } from '@/store/leaderboard/state'
import { colors } from '@/theme/tokens'

export interface BoardGalleryProps {
  list: BoardItem[]
  activeId: string
  onSelectBoard: (board: BoardItem) => void
}

// 榜单主题色与预置 TOP 3 歌曲推荐（增强视觉真实感与质感）
const BOARD_THEMES: Record<string, { bg: string, text: string, topSongs: Array<{ title: string, artist: string }> }> = {
  '热歌': {
    bg: '#EA580C',
    text: '#FFFFFF',
    topSongs: [
      { title: '离别开出花', artist: '就是南方凯' },
      { title: '爱如火', artist: '卫兰' },
      { title: '若月亮没来', artist: '王宇宙 / 乔浚丞' }
    ]
  },
  '新歌': {
    bg: '#2563EB',
    text: '#FFFFFF',
    topSongs: [
      { title: '暮色回响', artist: '吉星出租' },
      { title: '巡光而行', artist: '周深' },
      { title: '烟雨江南', artist: '单依纯' }
    ]
  },
  '飙升': {
    bg: '#DC2626',
    text: '#FFFFFF',
    topSongs: [
      { title: '指纹 (Live)', artist: '杜宣达' },
      { title: '晴天', artist: '周杰伦' },
      { title: '如果可以', artist: '韦礼安' }
    ]
  },
  '流行': {
    bg: '#7C3AED',
    text: '#FFFFFF',
    topSongs: [
      { title: '奢香夫人', artist: '凤凰传奇' },
      { title: '乌梅子酱', artist: '李荣浩' },
      { title: '年少的你啊', artist: '屠洪刚' }
    ]
  },
  '欧美': {
    bg: '#0D9488',
    text: '#FFFFFF',
    topSongs: [
      { title: 'Cruel Summer', artist: 'Taylor Swift' },
      { title: 'Stay', artist: 'The Kid LAROI / Justin Bieber' },
      { title: 'Shape of You', artist: 'Ed Sheeran' }
    ]
  },
  '网络': {
    bg: '#D97706',
    text: '#FFFFFF',
    topSongs: [
      { title: '向云端', artist: '小霞 / 李健' },
      { title: '精卫', artist: '海来阿木' },
      { title: '雪龙吟', artist: '张杰' }
    ]
  },
}

// 获取榜单配色与预览歌曲
const getBoardMeta = (name: string, index: number) => {
  for (const [key, val] of Object.entries(BOARD_THEMES)) {
    if (name.includes(key)) return val
  }
  const defaultPalette = [
    { bg: '#EA580C', text: '#FFFFFF', topSongs: [{ title: '风继续吹', artist: '张国荣' }, { title: '海阔天空', artist: 'Beyond' }, { title: '光辉岁月', artist: 'Beyond' }] },
    { bg: '#2563EB', text: '#FFFFFF', topSongs: [{ title: '七里香', artist: '周杰伦' }, { title: '青花瓷', artist: '周杰伦' }, { title: '夜曲', artist: '周杰伦' }] },
    { bg: '#7C3AED', text: '#FFFFFF', topSongs: [{ title: '富士山下', artist: '陈奕迅' }, { title: '红玫瑰', artist: '陈奕迅' }, { title: '十年', artist: '陈奕迅' }] },
    { bg: '#0D9488', text: '#FFFFFF', topSongs: [{ title: '起风了', artist: '买辣椒也用券' }, { title: '平凡之路', artist: '朴树' }, { title: '消愁', artist: '毛不易' }] },
  ]
  return defaultPalette[index % defaultPalette.length]
}

/**
 * QQ 音乐标准级：官方大三联榜单复合卡片流
 * 左侧 1:1 大圆角官方精美封面，右侧 TOP 1/2/3 试听行排版
 */
export default memo(({ list, activeId, onSelectBoard }: BoardGalleryProps) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerTitleRow}>
        <Text style={styles.headerTitle}>官方精选榜单</Text>
        <Text style={styles.headerSub}>共收录 {list.length} 个权威榜单 · 每日实时更新</Text>
      </View>

      <View style={styles.cardList}>
        {list.map((item, index) => {
          const meta = getBoardMeta(item.name, index)
          const active = activeId === item.id

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.boardCard, active && styles.boardCardActive]}
              activeOpacity={0.8}
              onPress={() => onSelectBoard(item)}
            >
              {/* 左侧：精美大封面卡片 */}
              <View style={[styles.coverBox, { backgroundColor: meta.bg }]}>
                <View style={styles.coverInner}>
                  <Text style={styles.coverName} numberOfLines={2}>{item.name}</Text>
                  <View style={styles.topBadge}>
                    <Text style={styles.topBadgeText}>TOP 100</Text>
                  </View>
                </View>
                {/* 右下角播放小按钮 */}
                <View style={styles.coverPlayBtn}>
                  <Icon name="play" size={10} color={meta.bg} />
                </View>
              </View>

              {/* 右侧：TOP 1/2/3 三行歌曲预览 */}
              <View style={styles.songsArea}>
                {meta.topSongs.map((song, sIdx) => {
                  const numColor = sIdx === 0 ? '#F5A623' : sIdx === 1 ? '#64748B' : '#B45309'
                  return (
                    <View key={sIdx} style={styles.songRow}>
                      <Text style={[styles.songIndex, { color: numColor }]}>{sIdx + 1}</Text>
                      <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                      <Text style={styles.songArtist} numberOfLines={1}> - {song.artist}</Text>
                    </View>
                  )
                })}
              </View>

              {/* 最右侧进入微箭头 */}
              <View style={styles.arrowBox}>
                <Icon name="chevron-right" size={14} color={colors.inkTertiary} />
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerTitleRow: {
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 3,
  },
  headerSub: {
    fontSize: 12,
    color: colors.inkTertiary,
  },
  cardList: {
    gap: 12,
  },
  boardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ECEEF1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  boardCardActive: {
    borderColor: colors.brand,
    backgroundColor: '#FFFDF9',
  },
  coverBox: {
    width: 86,
    height: 86,
    borderRadius: 10,
    padding: 8,
    position: 'relative',
    justifyContent: 'space-between',
    marginRight: 14,
  },
  coverInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  coverName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 17,
  },
  topBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  topBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coverPlayBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songsArea: {
    flex: 1,
    justifyContent: 'center',
    gap: 5,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songIndex: {
    fontSize: 13,
    fontWeight: '800',
    width: 16,
  },
  songTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    maxWidth: '55%',
  },
  songArtist: {
    fontSize: 12,
    color: colors.inkTertiary,
    flex: 1,
  },
  arrowBox: {
    paddingLeft: 6,
    paddingRight: 2,
  },
})
