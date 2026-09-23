import { Platform, type FlatListProps } from 'react-native'

/**
 * App 级列表滚动规范
 *
 * 我们是移动端 App，用户靠手指在屏幕上滑动浏览，不该出现浏览器式的滚动条。
 * react-native-web 只在 `showsVerticalScrollIndicator === false` 时才给滚动容器
 * 加上隐藏滚动条的样式，所以这里把「隐藏滚动条 + 原生手感」打包成一份可复用的
 * props，各列表直接展开使用即可，避免每个文件各写一套、漏掉就露出滚动条。
 *
 * 用法：
 *   <FlatList {...appListProps} data={...} />
 *   <FlatList {...appListProps} contentContainerStyle={appListContentPadding} ... />
 */

/** 隐藏滚动条 + 提升滚动流畅度，直接展开到 FlatList / ScrollView / SectionList */
export const appListProps = {
  // 隐藏滚动条：Web 端由 RNW 翻译成 scrollbar-width:none + ::-webkit-scrollbar
  // 原生端本身就是触摸滚动，这两个 prop 只是让行为保持一致
  showsVerticalScrollIndicator: false,
  showsHorizontalScrollIndicator: false,

  // 关闭「滚动时自动收起键盘」，滚动过程中键盘不闪，手感更连贯
  keyboardShouldPersistTaps: 'always' as const,

  // 每次滚动事件都下发（约 60fps）。列表里没有依赖 onScroll 做重计算，
  // 这个值主要影响 RNW 的节流，给足精度让滚动观感跟手
  scrollEventThrottle: 16,
}

/** 只隐藏滚动条，保持调用方原有的其它滚动 props */
export const appListScrollProps = {
  showsVerticalScrollIndicator: false,
  showsHorizontalScrollIndicator: false,
}

/** 单列列表的性能参数：固定行高时开启，跳过测量与布局递归，滚动不掉帧 */
export const flatListPerfProps = {
  removeClippedSubviews: Platform.OS !== 'web',
  initialNumToRender: 12,
  maxToRenderPerBatch: 10,
  windowSize: 7,
  updateCellsBatchingPeriod: 50,
} as const

/**
 * FlatList 通用默认项：隐藏滚动条 + 平滑滚动 + 性能参数。
 * 注意 windowSize/removeClippedSubviews 对「固定行高单列」最有效；
 * 多列网格（numColumns > 1）或行高不定的列表请只展开 appListProps。
 */
export const defaultFlatListProps: Pick<
  FlatListProps<any>,
  'showsVerticalScrollIndicator' | 'showsHorizontalScrollIndicator' | 'keyboardShouldPersistTaps' | 'scrollEventThrottle'
> = appListProps
