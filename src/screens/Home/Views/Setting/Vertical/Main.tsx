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
import { neoColors } from '@/theme/neobrutalism'

const SettingHeaderBanner = () => {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerLeft}>
        <View style={styles.bannerTitleRow}>
          <Text style={styles.bannerTitle}>⚙️ 设置中心</Text>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>PREFS</Text>
          </View>
        </View>
        <Text style={styles.bannerSubtitle}>个性化偏好 · 音源配置 · 系统设置</Text>
      </View>
      <View style={styles.bannerIconBox}>
        <Text style={styles.bannerIconText}>⚡</Text>
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
    backgroundColor: '#FFFDF5', // 复古波普米奶底纸
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
  },
  content: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 160, // 充足底部安全内边距，彻底杜绝 PlayerBar 与 TabBar 遮挡
    flex: 0,
  },
  banner: {
    backgroundColor: neoColors.yellow,
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 3.5, height: 3.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
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
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
  },
  bannerBadge: {
    backgroundColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    transform: [{ rotate: '2deg' }],
  },
  bannerBadgeText: {
    color: neoColors.yellow,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
    marginTop: 4,
  },
  bannerIconBox: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  bannerIconText: {
    fontSize: 18,
    // ⚠️ 必须显式给色：默认色走主题的 c-font，深色主题下是浅灰 rgb(219,219,219)，
    // 落在纯白图标框上对比度仅 1.38:1，几乎看不见。
    color: '#000000',
  },
})

