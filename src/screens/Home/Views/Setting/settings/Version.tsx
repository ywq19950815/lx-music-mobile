import { memo } from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'

import Section from '../components/Section'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { colors, radius } from '@/theme/tokens'
import { showModal } from '@/core/version'

const currentVer = process.versions.app

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_version')} icon="available_updates">
      <View style={styles.card}>
        <View style={styles.left}>
          <Text style={styles.label}>{t('version_label_current_ver')}</Text>
          <Text style={styles.version}>v{currentVer}</Text>
        </View>
        <TouchableOpacity
          style={styles.badge}
          activeOpacity={0.7}
          onPress={() => {
            void showModal()
          }}
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(49, 199, 124, 0.12)',
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E9E5F',
  },
})
