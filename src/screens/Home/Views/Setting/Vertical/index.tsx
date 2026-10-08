import { View, StyleSheet } from 'react-native'
import Main from './Main'

const Content = ({ onBack }: { onBack?: () => void }) => {
  return (
    <View style={styles.container}>
      <Main onBack={onBack} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
})

export default Content

