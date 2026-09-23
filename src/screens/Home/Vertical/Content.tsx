import { View } from 'react-native'
import Header from './Header'
import Main from './Main'
import { createStyle } from '@/utils/tools'

// 移除老式抽屉侧滑导航，主界面采用底部 Tab 导航（对齐汽水音乐交互）
//
// 注意：这里必须用一个 flex:1 的 View 把 Header + Main 包起来。
// 之前返回裸 Fragment，Main 的 flex:1 拿不到确定高度，PagerView 内容会无限高——
// 设置页会把底部 TabBar 顶到屏幕外几千像素，表现就是「页面底部被遮挡 / 滚不到底」。
const Content = () => {
  return (
    <View style={styles.container}>
      <Header />
      <Main />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    // 没有它，flex 子项会被内容撑开而不是被压缩
    minHeight: 0,
    overflow: 'hidden',
  },
})

export default Content
