import { memo, useCallback, useMemo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'

import Section from '../components/Section'

import { openUrl } from '@/utils/tools'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

const APP_VERSION = process.versions.app
const LINKS = {
  repo: 'https://github.com/lyswhut/lx-music-mobile#readme',
  release: 'https://github.com/lyswhut/lx-music-mobile/releases',
  faq: 'https://lyswhut.github.io/lx-music-doc/mobile/faq',
  issue: 'https://github.com/lyswhut/lx-music-mobile/issues?q=is%3Aissue+',
} as const

interface LinkItem {
  key: keyof typeof LINKS
  label: string
  icon: string
  color: string
}

/**
 * 关于页（Neo-Brutalism）
 * 结构：品牌卡 → 链接按钮网格 → 声明提示条 → 署名人
 */
export default memo(() => {
  const t = useI18n()

  const links = useMemo<LinkItem[]>(() => [
    { key: 'repo', label: t('about_link_repo'), icon: 'home', color: neoColors.yellow },
    { key: 'release', label: t('about_link_release'), icon: 'download-2', color: neoColors.cyan },
    { key: 'faq', label: t('about_link_faq'), icon: 'help', color: neoColors.purple },
    { key: 'issue', label: t('about_link_issue'), icon: 'comment', color: neoColors.pink },
  ], [t])

  const tips = useMemo(() => [
    { key: 'free', icon: 'love', color: neoColors.green, title: t('about_tip_free_title'), desc: t('about_tip_free_desc') },
    { key: 'noad', icon: 'thumbs-up', color: neoColors.yellow, title: t('about_tip_no_ad_title'), desc: t('about_tip_no_ad_desc') },
    { key: 'beware', icon: 'help', color: neoColors.orange, title: t('about_tip_beware_title'), desc: t('about_tip_beware_desc') },
  ], [t])

  const handleOpen = useCallback((key: keyof typeof LINKS) => {
    void openUrl(LINKS[key])
  }, [])

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

      {/* 链接入口：2 列波普按钮网格 */}
      <View style={styles.linkGrid}>
        {links.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.linkBtn, { backgroundColor: item.color }]}
            activeOpacity={0.75}
            onPress={() => { handleOpen(item.key) }}
          >
            <Icon name={item.icon} size={15} color={neoColors.black} />
            <Text style={styles.linkText} numberOfLines={1}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 声明提示条 */}
      {tips.map(tip => (
        <View key={tip.key} style={styles.tipRow}>
          <View style={[styles.tipIcon, { backgroundColor: tip.color }]}>
            <Icon name={tip.icon} size={13} color={neoColors.black} />
          </View>
          <View style={styles.tipBody}>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipDesc}>{tip.desc}</Text>
          </View>
        </View>
      ))}

      {/* 署名 */}
      <View style={styles.byRow}>
        <Text style={styles.byLabel}>{t('about_by')}</Text>
        <Text style={styles.byName}>Andy</Text>
      </View>
    </Section>
  )
})

const styles = StyleSheet.create({
  // ---- 品牌卡 ----
  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: neoColors.offWhite,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusMd,
  },
  brandMark: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: neoColors.black,
    borderRadius: neoBorders.radiusSm,
  },
  brandMarkText: {
    fontSize: 20,
    fontWeight: '900',
    color: neoColors.yellow,
  },
  brandInfo: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '900',
    color: neoColors.black,
    letterSpacing: -0.4,
  },
  brandSlogan: {
    marginTop: 2,
    fontSize: 11.5,
    fontWeight: '600',
    color: neoColors.gray700,
  },
  versionTag: {
    flexGrow: 0,
    flexShrink: 0,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: neoColors.yellow,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusPill,
  },
  versionTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: neoColors.black,
  },

  // ---- 链接网格 ----
  linkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  linkBtn: {
    // 2 列布局：每列约 48%，靠 justifyContent 撑开剩余间隙
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: '1%',
    marginBottom: 8,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusSm,
    boxShadow: neoShadows.sm.boxShadow,
  },
  linkText: {
    marginLeft: 6,
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '800',
    color: neoColors.black,
  },

  // ---- 声明提示条 ----
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  tipIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginRight: 8,
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

  // ---- 署名 ----
  byRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: neoBorders.thin,
    borderTopColor: neoColors.gray200,
  },
  byLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: neoColors.gray700,
  },
  byName: {
    marginLeft: 6,
    paddingHorizontal: 7,
    paddingVertical: 1,
    fontSize: 11.5,
    fontWeight: '900',
    color: neoColors.black,
    backgroundColor: neoColors.cyan,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusPill,
    overflow: 'hidden',
  },
})
