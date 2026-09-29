import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { colors, radius } from '@/theme/tokens'
import { createStyle } from '@/utils/tools'

/**
 * 列表加载失败空态（2026-09-29）：
 * 列表无数据且加载失败时，替代原来孤零零一行小字的完整居中错误态。
 * 用于歌单广场 / 排行榜 / 搜索结果等 OnlineList 类列表。
 */
export default memo(({ onRetry }: { onRetry: () => void }) => {
  const t = useI18n()
  return (
    <View style={styles.box}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconEmoji}>😥</Text>
      </View>
      <Text style={styles.title}>{t('list_error')}</Text>
      <Text style={styles.subtitle}>{t('list_error_hint')}</Text>
      <TouchableOpacity style={styles.btn} activeOpacity={0.82} onPress={onRetry}>
        <Text style={styles.btnText}>{t('list_error_retry')}</Text>
      </TouchableOpacity>
    </View>
  )
})

const styles = createStyle({
  box: {
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 60,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.inkTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  btn: {
    height: 36,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
