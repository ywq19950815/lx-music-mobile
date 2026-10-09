import { forwardRef, useImperativeHandle, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import SortTab, { type SortTabProps, type SortTabType } from './SortTab'
import SourceSelector, {
  type SourceSelectorType,
  type SourceSelectorProps,
} from './SourceSelector'
import { type Source } from '@/store/songlist/state'
import { colors } from '@/theme/tokens'

export interface HeaderBarProps {
  onSortChange: SortTabProps['onSortChange']
  onSourceChange: SourceSelectorProps['onSourceChange']
  onTagChange?: (name: string, id: string) => void
}

export interface HeaderBarType {
  setSource: (source: Source, sortId: string, tagName?: string, tagId?: string) => void
}

/**
 * 歌单顶栏：
 * 精简重构，移除空无一物的「默认 ▾」标签下拉选择以及多余的「打开」按键；
 * 仅保留核心的「分类微胶囊（最新/最热/推荐等）」与「平台音源切换器」，与系统状态栏一体沉浸。
 */
export default forwardRef<HeaderBarType, HeaderBarProps>(({ onSortChange, onSourceChange }, ref) => {
  const sortTabRef = useRef<SortTabType>(null)
  const sourceSelectorRef = useRef<SourceSelectorType>(null)

  useImperativeHandle(ref, () => ({
    setSource(source, sortId) {
      sortTabRef.current?.setSource(source, sortId)
      sourceSelectorRef.current?.setSource(source)
    },
  }), [])

  return (
    <View style={styles.headerBar}>
      <View style={styles.sortTabWrap}>
        <SortTab ref={sortTabRef} onSortChange={onSortChange} />
      </View>
      <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} />
    </View>
  )
})

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 42,
    paddingVertical: 4,
    zIndex: 2,
    backgroundColor: colors.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F2F5',
  },
  sortTabWrap: {
    flex: 1,
    minWidth: 0,
  },
})
