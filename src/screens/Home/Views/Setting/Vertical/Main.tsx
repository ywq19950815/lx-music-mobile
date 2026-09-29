import { memo, useCallback, useMemo, useState } from 'react'
import { ScrollView, View, TouchableOpacity, StyleSheet } from 'react-native'

import Basic from '../settings/Basic'
import Player from '../settings/Player'
import LyricDesktop from '../settings/LyricDesktop'
import Search from '../settings/Search'
import List from '../settings/List'
import Sync from '../settings/Sync'
import Backup from '../settings/Backup'
import Other from '../settings/Other'
import Version from '../settings/Version'
import About from '../settings/About'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { colors } from '@/theme/tokens'
import { useI18n } from '@/lang'
import { SETTING_SCREENS, type SettingScreenIds } from '../Main'
import { useBackHandler } from '@/utils/hooks/useBackHandler'

// 各分类的菜单图标与主题色（仅用于菜单入口视觉）
const CATEGORY_META: Record<SettingScreenIds, { icon: string, color: string }> = {
  basic: { icon: 'setting', color: '#10B981' },
  player: { icon: 'play', color: '#3B82F6' },
  lyric_desktop: { icon: 'lyric-on', color: '#8B5CF6' },
  search: { icon: 'search-2', color: '#F59E0B' },
  list: { icon: 'list-order', color: '#EC4899' },
  sync: { icon: 'download-2', color: '#06B6D4' },
  backup: { icon: 'sd-card', color: '#14B8A6' },
  other: { icon: 'dots-vertical', color: '#64748B' },
  version: { icon: 'available_updates', color: '#F43F5E' },
  about: { icon: 'help', color: '#0EA5E9' },
}

const SettingHeaderBanner = () => {
  return (
    <View style={styles.hero}>
      <View style={styles.heroDecoA} />
      <View style={styles.heroDecoB} />
      <View style={styles.heroRow}>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>设置</Text>
          <Text style={styles.heroSubtitle}>音源 · 播放 · 歌词 · 备份同步</Text>
        </View>
        <View style={styles.heroIconBox}>
          <Icon name="setting" size={22} color="#FFFFFF" />
        </View>
      </View>
    </View>
  )
}

const CategoryRow = memo(({ id, onPress }: {
  id: SettingScreenIds
  onPress: (id: SettingScreenIds) => void
}) => {
  const t = useI18n()
  const meta = CATEGORY_META[id]
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.65}
      onPress={() => onPress(id)}
    >
      <View style={[styles.iconChip, { backgroundColor: meta.color + '1F' }]}>
        <Icon name={meta.icon} size={18} color={meta.color} />
      </View>
      <Text style={styles.rowTitle}>{t(`setting_${id}`)}</Text>
      <Icon name="chevron-right" size={18} color={colors.inkTertiary} style={styles.rowChevron} />
    </TouchableOpacity>
  )
}, (prev, next) => prev.id === next.id && prev.onPress === next.onPress)

const MenuView = ({ onSelect }: { onSelect: (id: SettingScreenIds) => void }) => {
  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps={'always'}
      showsVerticalScrollIndicator={false}
    >
      <SettingHeaderBanner />
      <View style={styles.menuCard}>
        {SETTING_SCREENS.map((id, i) => (
          <View key={id}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <CategoryRow id={id} onPress={onSelect} />
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const renderScreen = (id: SettingScreenIds) => {
  switch (id) {
    case 'player': return <Player />
    case 'lyric_desktop': return <LyricDesktop />
    case 'search': return <Search />
    case 'list': return <List />
    case 'sync': return <Sync />
    case 'backup': return <Backup />
    case 'other': return <Other />
    case 'version': return <Version />
    case 'about': return <About />
    case 'basic':
    default: return <Basic />
  }
}

const DetailView = ({ id, onBack }: {
  id: SettingScreenIds
  onBack: () => void
}) => {
  const content = useMemo(() => renderScreen(id), [id])
  return (
    <View style={styles.detailWrap}>
      <TouchableOpacity style={styles.backBtn} activeOpacity={0.6} onPress={onBack}>
        <Icon name="chevron-left" size={22} color={colors.ink} />
      </TouchableOpacity>
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.content, styles.detailContent]}
        keyboardShouldPersistTaps={'always'}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    </View>
  )
}

export default () => {
  const [activeId, setActiveId] = useState<SettingScreenIds | null>(null)

  const handleSelect = useCallback((id: SettingScreenIds) => {
    setActiveId(id)
  }, [])
  const handleBack = useCallback(() => {
    setActiveId(null)
    return true
  }, [])
  useBackHandler(activeId ? handleBack : () => false)

  return (
    <View style={styles.container}>
      {activeId ? (
        <DetailView id={activeId} onBack={() => setActiveId(null)} />
      ) : (
        <MenuView onSelect={handleSelect} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    backgroundColor: '#F8F9FA',
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
  },
  content: {
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 12,
    paddingBottom: 160,
    flex: 0,
  },
  hero: {
    backgroundColor: colors.brand,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  heroDecoA: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroDecoB: {
    position: 'absolute',
    bottom: -50,
    right: 40,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: 6,
  },
  heroIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 56,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  rowChevron: {
    marginLeft: 6,
  },
  detailWrap: {
    flex: 1,
    height: '100%',
  },
  backBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  detailContent: {
    paddingTop: 64,
  },
})
