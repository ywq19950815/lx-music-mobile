import { useMemo } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

interface Props {
  title: string
  children: React.ReactNode | React.ReactNode[]
}

/**
 * 根据标题关键词自动匹配 Neo-Brutalism 波普徽章配置 (色彩 + 趣味 Emoji)
 */
const getSectionBadge = (title: string) => {
  const lower = title.toLowerCase()
  if (lower.includes('基本') || lower.includes('basic')) {
    return { bg: neoColors.yellow, emoji: '⚙️' }
  }
  if (lower.includes('播放') || lower.includes('player')) {
    return { bg: neoColors.cyan, emoji: '🎵' }
  }
  if (lower.includes('歌词') || lower.includes('lyric')) {
    return { bg: neoColors.pink, emoji: '💬' }
  }
  if (lower.includes('搜索') || lower.includes('search')) {
    return { bg: neoColors.green, emoji: '🔍' }
  }
  if (lower.includes('列表') || lower.includes('list')) {
    return { bg: neoColors.purple, emoji: '📋' }
  }
  if (lower.includes('同步') || lower.includes('sync')) {
    return { bg: neoColors.orange, emoji: '🔄' }
  }
  if (lower.includes('备份') || lower.includes('backup')) {
    return { bg: neoColors.yellow, emoji: '💾' }
  }
  if (lower.includes('其他') || lower.includes('other')) {
    return { bg: neoColors.cyan, emoji: '🧩' }
  }
  if (lower.includes('版本') || lower.includes('version')) {
    return { bg: neoColors.pink, emoji: '🚀' }
  }
  if (lower.includes('关于') || lower.includes('about')) {
    return { bg: neoColors.blue, emoji: '📖' }
  }
  return { bg: neoColors.yellow, emoji: '⚡' }
}

export default ({ title, children }: Props) => {
  const { bg, emoji } = useMemo(() => getSectionBadge(title), [title])

  return (
    <View style={styles.cardContainer}>
      {/* 卡片头部波普横幅 */}
      <View style={styles.cardHeader}>
        <View style={[styles.badgePill, { backgroundColor: bg }]}>
          <Text style={styles.badgeEmoji}>{emoji}</Text>
          <Text style={styles.badgeText}>{title}</Text>
        </View>
      </View>

      {/* 卡片内容主体 */}
      <View style={styles.cardBody}>
        {children}
      </View>
    </View>
  )
}

const styles = createStyle({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 3.5, height: 3.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8F8F5',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  badgeEmoji: {
    fontSize: 13,
    marginRight: 6,
    // ⚠️ 必须显式给色：默认色走主题的 c-font，深色主题下是浅灰 rgb(219,219,219)，
    // 落在高饱和亮色徽章（黄/青/粉/紫/蓝）上几乎不可见。
    color: '#000000',
  },
  badgeText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.2,
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
})

