import { memo, useState } from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'

import Section from '../components/Section'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { colors, radius } from '@/theme/tokens'
import { checkUpdate } from '@/core/version'
import versionState from '@/store/version/state'
import { toast } from '@/utils/tools'

const currentVer = process.versions.app

export default memo(() => {
  const t = useI18n()
  const [checking, setChecking] = useState(false)

  /**
   * 检查更新：一键直达，反馈明确
   * - 立即 toast「检查更新中」
   * - 已是最新 / 请求失败：toast 明确告知
   * - 有新版本：checkUpdate 内部自动弹出更新窗口
   */
  const handleCheck = async() => {
    if (checking) return
    setChecking(true)
    toast(t('version_tip_checking'))
    try {
      // 15s 兜底：避免弱网下 fetch 悬挂导致按钮一直无反馈
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
    // 有新版本：更新窗口已自动弹出（被忽略的版本则给出提示）
    if (info.newVersion) toast(t('version_tip_new_found', { version: info.newVersion.version }))
  }

  return (
    <Section title={t('setting_version')} icon="available_updates">
      <View style={styles.card}>
        <View style={styles.left}>
          <Text style={styles.label}>{t('version_label_current_ver')}</Text>
          <Text style={styles.version}>v{currentVer}</Text>
        </View>
        <TouchableOpacity
          style={[styles.badge, checking && styles.badgeChecking]}
          activeOpacity={0.7}
          disabled={checking}
          onPress={() => { void handleCheck() }}
        >
          <Text style={styles.badgeText}>{t('setting_version_show_ver_modal')}</Text>
        </TouchableOpacity>
      </View>
    </Section>
  )
})

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
  },
  left: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.inkTertiary,
  },
  version: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  badge: {
    flexGrow: 0,
    flexShrink: 0,
    marginLeft: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: radius.pill,
  },
  badgeChecking: {
    opacity: 0.6,
  },
  badgeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#059669',
  },
})
