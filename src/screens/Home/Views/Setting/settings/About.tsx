import { memo, useMemo, useState } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'

import Section from '../components/Section'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { colors, radius } from '@/theme/tokens'
import { checkUpdate } from '@/core/version'
import versionState from '@/store/version/state'
import { toast } from '@/utils/tools'

const APP_VERSION = process.versions.app

export default memo(() => {
  const t = useI18n()
  const [checking, setChecking] = useState(false)

  const handleCheckUpdate = async() => {
    if (checking) return
    setChecking(true)
    toast(t('version_tip_checking'))
    try {
      await Promise.race([
        checkUpdate(),
        new Promise(resolve => { setTimeout(resolve, 15000) }),
      ])
    } finally {
      setChecking(false)
    }
    const info = versionState.versionInfo
    if (info.status === 'checking' || info.isUnknown) {
      toast(t('version_tip_unknown'))
      return
    }
    if (info.isLatest) {
      toast(t('version_tip_latest'))
      return
    }
    if (info.newVersion) {
      toast(t('version_tip_new_found', { version: info.newVersion.version }))
    }
  }

  const tips = useMemo(() => [
    { key: 'free', icon: 'love', color: colors.brand, title: t('about_tip_free_title'), desc: t('about_tip_free_desc') },
    { key: 'noad', icon: 'thumbs-up', color: '#3B82F6', title: t('about_tip_no_ad_title'), desc: t('about_tip_no_ad_desc') },
    { key: 'beware', icon: 'help', color: '#F97316', title: t('about_tip_beware_title'), desc: t('about_tip_beware_desc') },
  ], [t])

  return (
    <Section title="关于与更新" icon="help">
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

      {/* 检查更新操作卡片（合并原 Version 屏） */}
      <View style={styles.updateCard}>
        <View style={styles.updateLeft}>
          <Text style={styles.updateTitle}>软件更新</Text>
          <Text style={styles.updateDesc}>当前已安装：v{APP_VERSION}，支持在线平滑升级</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkBtn, checking && styles.checkBtnDisabled]}
          activeOpacity={0.75}
          disabled={checking}
          onPress={() => { void handleCheckUpdate() }}
        >
          <Icon name="available_updates" size={13} color="#FFFFFF" style={styles.checkBtnIcon} />
          <Text style={styles.checkBtnText}>{checking ? '检查中...' : '检查更新'}</Text>
        </TouchableOpacity>
      </View>

      {/* 声明提示卡片 */}
      <View style={styles.tipsContainer}>
        {tips.map(tip => (
          <View key={tip.key} style={styles.tipCard}>
            <View style={[styles.tipIcon, { backgroundColor: tip.color }]}>
              <Icon name={tip.icon} size={12} color="#FFFFFF" />
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
    paddingVertical: 14,
    marginBottom: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#ECEFF4',
    borderRadius: 14,
  },
  brandMark: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: colors.brand,
    borderRadius: 12,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  brandMarkText: {
    fontSize: 22,
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
    paddingVertical: 3.5,
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
    borderRadius: radius.pill,
  },
  versionTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.brand,
  },

  // ---- 检查更新卡片 ----
  updateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#ECEFF4',
    borderRadius: 14,
  },
  updateLeft: {
    flex: 1,
    paddingRight: 10,
  },
  updateTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
  },
  updateDesc: {
    fontSize: 12,
    color: colors.inkSecondary,
    marginTop: 2,
  },
  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  checkBtnDisabled: {
    opacity: 0.6,
  },
  checkBtnIcon: {
    marginRight: 4,
  },
  checkBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ---- 声明卡片列表 ----
  tipsContainer: {
    gap: 8,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 11,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#ECEFF4',
    borderRadius: 12,
  },
  tipIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginRight: 10,
    borderRadius: 11,
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
    fontSize: 11.5,
    fontWeight: '400',
    lineHeight: 17,
    color: colors.inkSecondary,
  },
})
