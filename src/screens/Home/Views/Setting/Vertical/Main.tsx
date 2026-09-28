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
})
