import { View, StyleSheet } from 'react-native'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import TabBar from './TabBar'
import { neoColors } from '@/theme/neobrutalism'

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
    backgroundColor: neoColors.offWhite,
  },
})
