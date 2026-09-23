import { View, StyleSheet } from 'react-native'
import Main from './Main'

const Content = () => {
  return (
    <View style={styles.container}>
      <Main />
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

