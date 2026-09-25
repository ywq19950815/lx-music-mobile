import { ScrollView, View, StyleSheet } from 'react-native'

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
import { colors, radius } from '@/theme/tokens'

const SettingHeaderBanner = () => {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerLeft}>
        <View style={styles.bannerTitleRow}>
          <Text style={styles.bannerTitle}>设置与偏好</Text>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>PREFERENCES</Text>
          </View>
        </View>
        <Text style={styles.bannerSubtitle}>音源管理 · 播放体验 · 桌面歌词 · 备份与同步</Text>
      </View>
      <View style={styles.bannerIconBox}>
        <Icon name="setting" size={18} color={colors.brand} />
      </View>
    </View>
  )
}

export default () => {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps={'always'}
        showsVerticalScrollIndicator={false}
      >
        <SettingHeaderBanner />
        <Basic />
        <Player />
        <LyricDesktop />
        <Search />
        <List />
        <Sync />
        <Backup />
        <Other />
        <Version />
        <About />
      </ScrollView>
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
  banner: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF2',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerLeft: {
    flex: 1,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  bannerBadge: {
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bannerBadgeText: {
    color: colors.brand,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontSize: 11.5,
    fontWeight: '400',
    color: colors.inkTertiary,
    marginTop: 4,
  },
  bannerIconBox: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
