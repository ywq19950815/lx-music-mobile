import { memo, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'

import Section from '../components/Section'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { colors, radius } from '@/theme/tokens'

const APP_VERSION = process.versions.app

export default memo(() => {
  const t = useI18n()

  const tips = useMemo(() => [
    { key: 'free', icon: 'love', color: '#10B981', title: t('about_tip_free_title'), desc: t('about_tip_free_desc') },
    { key: 'noad', icon: 'thumbs-up', color: colors.brand, title: t('about_tip_no_ad_title'), desc: t('about_tip_no_ad_desc') },
    { key: 'beware', icon: 'help', color: '#F97316', title: t('about_tip_beware_title'), desc: t('about_tip_beware_desc') },
  ], [t])

  return (
    <Section title={t('setting_about')}>
      {/* 品牌卡：应用名 + 版本 + 定位语 */}
      <View style={styles.brandCard}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>♪</Text>
        </View>
        <View style={styles.brandInfo}>
          <Text style={styles.brandName}>安迪音乐 (Andy Music)</Text>
          <Text style={styles.brandSlogan}>{t('about_slogan')}</Text>
        </View>
        <View style={styles.versionTag}>
          <Text style={styles.versionTagText}>v{APP_VERSION}</Text>
        </View>
      </View>

      {/* 声明提示卡片 */}
      <View style={styles.tipsContainer}>
        {tips.map(tip => (
          <View key={tip.key} style={styles.tipCard}>
            <View style={[styles.tipIcon, { backgroundColor: tip.color }]}>
              <Icon name={tip.icon} size={13} color="#FFFFFF" />
            </View>
            <View style={styles.tipBody}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipDesc}>{tip.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </Section>
  )
})

const styles = StyleSheet.create({
  // ---- 品牌卡 ----
  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
  },
  brandMark: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: colors.brand,
    borderRadius: 12,
  },
  brandMarkText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  brandInfo: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  brandSlogan: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '400',
    color: colors.inkTertiary,
  },
  versionTag: {
    flexGrow: 0,
    flexShrink: 0,
    marginLeft: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderRadius: radius.pill,
  },
  versionTagText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#B36B00',
  },

  // ---- 声明卡片列表 ----
  tipsContainer: {
    gap: 8,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
  },
  tipIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginRight: 10,
    borderRadius: 12,
  },
  tipBody: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  tipDesc: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.inkSecondary,
  },
})
