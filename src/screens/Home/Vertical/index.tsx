import { View } from 'react-native'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import TabBar from './TabBar'
import { createStyle } from '@/utils/tools'

export default () => {
  return (
    <View style={styles.container}>
      <Content />
      <PlayerBar isHome />
      <TabBar />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
})
