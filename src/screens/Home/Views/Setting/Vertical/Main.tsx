import { memo, useCallback, useMemo, useState } from 'react'
import { ScrollView, View, TouchableOpacity, StyleSheet } from 'react-native'

import Basic from '../settings/Basic'
import Player from '../settings/Player'
import LyricDesktop from '../settings/LyricDesktop'
import List from '../settings/List'
import Sync from '../settings/Sync'
import Backup from '../settings/Backup'
import Other from '../settings/Other'
import About from '../settings/About'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { colors } from '@/theme/tokens'
import { useI18n } from '@/lang'
import { type SettingScreenIds } from '../Main'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import SwipeBackView from '@/components/common/SwipeBackView'

// 各分类的菜单图标与主题色（QQ 音乐柔和配色规范）
const CATEGORY_META: Record<SettingScreenIds, { icon: string, color: string }> = {
  basic: { icon: 'setting', color: '#10B981' },
  player: { icon: 'play', color: colors.brand },
  lyric_desktop: { icon: 'lyric-on', color: '#8B5CF6' },
  list: { icon: 'list-order', color: '#EC4899' },
  sync: { icon: 'sync', color: '#06B6D4' },
  backup: { icon: 'sd-card', color: '#F59E0B' },
  other: { icon: 'dots-vertical', color: '#64748B' },
  about: { icon: 'help', color: '#3B82F6' },
}

// QQ 音乐式逻辑分组卡片体系
const SETTING_GROUPS: SettingScreenIds[][] = [
  ['basic', 'player', 'lyric_desktop', 'list'],
  ['sync', 'backup', 'other'],
  ['about'],
]

/**
 * 设置页通用一体化顶栏（背景色与状态栏无缝衔接，杜绝色块割裂）
 */
const SettingNavBar = ({ title, onBack }: { title: string, onBack?: () => void }) => {
  return (
    <View style={styles.navBar}>
      {onBack ? (
        <TouchableOpacity
          style={styles.navBackBtn}
          activeOpacity={0.7}
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-left" size={18} color={colors.ink} />
        </TouchableOpacity>
      ) : (
        <View style={styles.navPlaceholder} />
      )}
      <View style={styles.navCenter}>
        <Text style={styles.navTitle} numberOfLines={1}>{title}</Text>
      </View>
      <View style={styles.navPlaceholder} />
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
      <View style={[styles.iconChip, { backgroundColor: meta.color + '15' }]}>
        <Icon name={meta.icon} size={17} color={meta.color} />
      </View>
      <Text style={styles.rowTitle}>{t(`setting_${id}`)}</Text>
      <Icon name="chevron-right" size={16} color={colors.inkTertiary} style={styles.rowChevron} />
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
      {SETTING_GROUPS.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.menuCard}>
          {group.map((id, i) => (
            <View key={id}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <CategoryRow id={id} onPress={onSelect} />
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

const renderScreen = (id: SettingScreenIds) => {
  switch (id) {
    case 'player': return <Player />
    case 'lyric_desktop': return <LyricDesktop />
    case 'list': return <List />
    case 'sync': return <Sync />
    case 'backup': return <Backup />
    case 'other': return <Other />
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
    <SwipeBackView onBack={onBack}>
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.content, styles.detailContent]}
        keyboardShouldPersistTaps={'always'}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    </SwipeBackView>
  )
}

export interface SettingMainProps {
  onBack?: () => void
}

export default ({ onBack }: SettingMainProps) => {
  const [activeId, setActiveId] = useState<SettingScreenIds | null>(null)
  const t = useI18n()

  const handleSelect = useCallback((id: SettingScreenIds) => {
    setActiveId(id)
  }, [])

  const handleBackToMenu = useCallback(() => {
    setActiveId(null)
    return true
  }, [])

  useBackHandler(activeId ? handleBackToMenu : () => false)

  const currentTitle = activeId ? t(`setting_${activeId}`) : (onBack ? '应用设置' : '设置')
  const handleNavBack = activeId ? handleBackToMenu : onBack

  return (
    <View style={styles.container}>
      <SettingNavBar title={currentTitle} onBack={handleNavBack} />
      {activeId ? (
        <DetailView id={activeId} onBack={handleBackToMenu} />
      ) : onBack ? (
        <SwipeBackView onBack={onBack}>
          <MenuView onSelect={handleSelect} />
        </SwipeBackView>
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
    backgroundColor: '#F7F8FA',
  },
  // ── 一体化顶栏 ─────────────────────────────
  navBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#F7F8FA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  navBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  navPlaceholder: {
    width: 34,
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
  },

  // ── 内容区 ─────────────────────────────────
  list: {
    flexGrow: 1,
    flexShrink: 1,
  },
  content: {
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 12,
    paddingBottom: 28,
  },
  detailContent: {
    paddingTop: 12,
  },

  // ── 菜单卡片（QQ 音乐柔和微卡片体系） ─────────
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F4F5F7',
    marginLeft: 56,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 14,
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
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  rowChevron: {
    marginLeft: 6,
  },
})
