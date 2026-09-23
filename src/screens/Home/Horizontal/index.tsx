import { View } from 'react-native'
import Aside from './Aside'
import PlayerBar from '@/components/player/PlayerBar'
import StatusBar from '@/components/common/StatusBar'
import Header from './Header'
import Main from './Main'
import { useNavigationBarHeight } from '@/store/common/hook'
import { createStyle } from '@/utils/tools'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
})

export default () => {
  // 横屏/大屏布局没有底部 TabBar，播放条就是页面最底部，
  // 沉浸式下要自己让出底部系统栏（手势条）的高度
  const navigationBarHeight = useNavigationBarHeight()

  return (
    <>
      <StatusBar />
      <View style={styles.container}>
        <Aside />
        <View style={styles.content}>
          <Header />
          <Main />
          <View style={{ paddingBottom: navigationBarHeight }}>
            <PlayerBar isHome />
          </View>
        </View>
      </View>
    </>
  )
}
