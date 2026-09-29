import { View, StyleSheet } from 'react-native'
import Content from './Content'
import TabBar from './TabBar'
// 独立搜索页覆盖层：由任意入口通过 openSearchOverlay() 唤起，挂在这里可盖住 TabBar
import SearchOverlay from '../Views/SearchOverlay'
import { colors } from '@/theme/tokens'

export default () => {
  return (
    <View style={styles.container}>
      <Content />
      <TabBar />
      <SearchOverlay />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
})
