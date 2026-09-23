import { forwardRef, useImperativeHandle, useRef } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'

import SourceSelector, {
  type SourceSelectorType as _SourceSelectorType,
  type SourceSelectorProps as _SourceSelectorProps,
} from '@/components/SourceSelector'
import leaderboardState, { type Source, type InitState } from '@/store/leaderboard/state'

type Sources = Readonly<InitState['sources']>
type SourceSelectorCommonProps = _SourceSelectorProps<Sources>
type SourceSelectorCommonType = _SourceSelectorType<Sources>

export interface SourceSelectorProps {
  onSourceChange: SourceSelectorCommonProps['onSourceChange']
  style?: ViewStyle
}

export interface SourceSelectorType {
  setSource: (source: Source) => void
}

export default forwardRef<SourceSelectorType, SourceSelectorProps>(({ style, onSourceChange }, ref) => {
  const sourceSelectorRef = useRef<SourceSelectorCommonType>(null)

  useImperativeHandle(ref, () => ({
    setSource(source) {
      sourceSelectorRef.current?.setSourceList(leaderboardState.sources, source)
    },
  }), [])

  return (
    <View style={[styles.badgeWrap, style]}>
      <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} fontSize={12} center />
    </View>
  )
})

const styles = StyleSheet.create({
  /**
   * ⚠️ 这里只做「布局容器」，绝不能再画一遍胶囊外观。
   *
   * 内层的 <SourceSelector>（@/components/SourceSelector 的 sourceMenu）本身已经是
   * 一个完整的 Neo-Brutalism 胶囊：亮黄底 + 2px 纯黑描边 + 圆角 + 实体硬阴影。
   * 早先这里额外加了 backgroundColor/borderWidth/borderRadiusPill/shadow，
   * 于是渲染出「外层胶囊 套 内层圆角胶囊」的两层描边叠加，
   * 视觉上就是「两个内容叠在一起」（尤其黄色底 + 双黑边非常明显）。
   *
   * 搜索页（Search/HeaderBar）与歌单页（SongList/HeaderBar/SourceSelector）
   * 都只用 padding 做定位，胶囊外观由内层统一负责 —— 这里对齐同一做法。
   */
  badgeWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
