import { memo, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'

import Section from '../components/Section'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

const APP_VERSION = process.versions.app

/**
 * 关于页（Neo-Brutalism）
 * 结构：品牌卡 → 软件声明提示条（纯净无广告、完全免费、防骗提醒）
 * 不包含外部 GitHub 仓库链接与个人开发者署名
 */
export default memo(() => {
  const t = useI18n()

  const tips = useMemo(() => [
    { key: 'free', icon: 'love', color: neoColors.green, title: t('about_tip_free_title'), desc: t('about_tip_free_desc') },
    { key: 'noad', icon: 'thumbs-up', color: neoColors.yellow, title: t('about_tip_no_ad_title'), desc: t('about_tip_no_ad_desc') },
    { key: 'beware', icon: 'help', color: neoColors.orange, title: t('about_tip_beware_title'), desc: t('about_tip_beware_desc') },
  ], [t])

  return (
    <Section title={t('setting_about')}>
      {/* 品牌卡：应用名 + 版本 + 定位语 */}
      <View style={styles.brandCard}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>♪</Text>
        </View>
        <View style={styles.brandInfo}>
          <Text style={styles.brandName}>Andy Music</Text>
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
              <Icon name={tip.icon} size={14} color={neoColors.black} />
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: neoColors.offWhite,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusMd,
    boxShadow: neoShadows.sm.boxShadow,
  },
  brandMark: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: neoColors.black,
    borderRadius: neoBorders.radiusSm,
  },
  brandMarkText: {
    fontSize: 22,
    fontWeight: '900',
    color: neoColors.yellow,
  },
  brandInfo: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  brandName: {
    fontSize: 16.5,
    fontWeight: '900',
    color: neoColors.black,
    letterSpacing: -0.4,
  },
  brandSlogan: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: neoColors.gray700,
  },
  versionTag: {
    flexGrow: 0,
    flexShrink: 0,
    marginLeft: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: neoColors.yellow,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusPill,
  },
  versionTagText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: neoColors.black,
  },

  // ---- 声明卡片列表 ----
  tipsContainer: {
    gap: 8,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    backgroundColor: neoColors.offWhite,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusSm,
  },
  tipIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginRight: 10,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusPill,
  },
  tipBody: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: neoColors.black,
  },
  tipDesc: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    color: neoColors.gray700,
  },
})
