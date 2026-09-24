import { useMemo } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { colors, radius } from '@/theme/tokens'

interface Props {
  title: string
  children: React.ReactNode | React.ReactNode[]
}

const getSectionEmoji = (title: string) => {
  const lower = title.toLowerCase()
  if (lower.includes('基本') || lower.includes('basic')) return '⚙️'
  if (lower.includes('播放') || lower.includes('player')) return '🎵'
  if (lower.includes('歌词') || lower.includes('lyric')) return '💬'
  if (lower.includes('搜索') || lower.includes('search')) return '🔍'
  if (lower.includes('列表') || lower.includes('list')) return '📋'
  if (lower.includes('同步') || lower.includes('sync')) return '🔄'
  if (lower.includes('备份') || lower.includes('backup')) return '💾'
  if (lower.includes('其他') || lower.includes('other')) return '🧩'
  if (lower.includes('版本') || lower.includes('version')) return '🚀'
  if (lower.includes('关于') || lower.includes('about')) return '📖'
  return '⚡'
}

export default ({ title, children }: Props) => {
  const emoji = useMemo(() => getSectionEmoji(title), [title])

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.badgeEmoji}>{emoji}</Text>
          <Text style={styles.badgeText}>{title}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {children}
      </View>
    </View>
  )
}

const styles = createStyle({
  cardContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
})

