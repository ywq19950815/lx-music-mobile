import { View, StyleSheet } from 'react-native'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import TabBar from './TabBar'
import { colors } from '@/theme/tokens'

export default () => {
  return (
    <View style={styles.container}>
      <Content />
      <PlayerBar isHome />
      <TabBar />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
})
