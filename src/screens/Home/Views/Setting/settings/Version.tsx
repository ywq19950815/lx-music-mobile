import { memo } from 'react'
import { StyleSheet, View } from 'react-native'

import Section from '../components/Section'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

const currentVer = process.versions.app

/**
 * 版本信息（Neo-Brutalism）
 *
 * 本应用版本体系已从 v0.x 重新开始，且不再对外请求任何第三方版本信息，
 * 因此这里只展示本地当前版本，并固定提示「已是最新版本」，
 * 不再显示来源不明的「最新版本」号，也不提供在线升级入口。
 */
export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_version')}>
      <View style={styles.card}>
        <View style={styles.left}>
          <Text style={styles.label}>{t('version_label_current_ver')}</Text>
          <Text style={styles.version}>v{currentVer}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('version_tip_latest')}</Text>
        </View>
      </View>
    </Section>
  )
})

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: neoColors.offWhite,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusMd,
    boxShadow: neoShadows.sm.boxShadow,
  },
  left: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '800',
    color: neoColors.gray700,
  },
  version: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '900',
    color: neoColors.black,
    letterSpacing: -0.4,
  },
  badge: {
    flexGrow: 0,
    flexShrink: 0,
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: neoColors.green,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusPill,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: neoColors.black,
  },
})
