import { useRef, forwardRef, useImperativeHandle } from 'react'
import { View, StyleSheet } from 'react-native'
import SourceSelector, {
  type SourceSelectorType as _SourceSelectorType,
  type SourceSelectorProps as _SourceSelectorProps,
} from '@/components/SourceSelector'
import SearchInput, { type SearchInputType, type SearchInputProps } from './SearchInput'
import SearchTypeSelector from '../SearchTypeSelector'
import { type Source as MusicSource } from '@/store/search/music/state'
import { type Source as SonglistSource } from '@/store/search/songlist/state'
import { colors } from '@/theme/tokens'

type Sources = Readonly<Array<MusicSource | SonglistSource>>
type SourceSelectorProps = _SourceSelectorProps<Sources>
type SourceSelectorType = _SourceSelectorType<Sources>

export interface HeaderBarProps {
  onSourceChange: SourceSelectorProps['onSourceChange']
  onTipSearch: SearchInputProps['onChangeText']
  onSearch: SearchInputProps['onSubmit']
  onHideTipList: SearchInputProps['onBlur']
  onShowTipList: SearchInputProps['onTouchStart']
}

export interface HeaderBarType {
  setSourceList: SourceSelectorType['setSourceList']
  setText: SearchInputType['setText']
  setPlaceholder: SearchInputType['setPlaceholder']
  blur: SearchInputType['blur']
}

/**
 * 发现页搜索栏（设计稿：歌曲/歌单分段控制器 + 白底胶囊搜索框）。
 * 沉浸式延伸至状态栏下方，页面底色与内容区一致。
 */
export default forwardRef<HeaderBarType, HeaderBarProps>(({ onSourceChange, onTipSearch, onSearch, onHideTipList, onShowTipList }, ref) => {
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const searchInputRef = useRef<SearchInputType>(null)

  useImperativeHandle(ref, () => ({
    setSourceList(list, source) {
      sourceSelectorRef.current?.setSourceList(list, source)
    },
    setText(text) {
      searchInputRef.current?.setText(text)
    },
    setPlaceholder(holder) {
      searchInputRef.current?.setPlaceholder(holder)
    },
    blur() {
      searchInputRef.current?.blur()
    },
  }), [])

  return (
    <View style={styles.searchBar}>
      <SearchTypeSelector />
      <View style={styles.inputWrap}>
        <SearchInput
          ref={searchInputRef}
          prefix={<SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} integrated center />}
          onChangeText={onTipSearch}
          onSubmit={onSearch}
          onBlur={onHideTipList}
          onTouchStart={onShowTipList}
        />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    zIndex: 2,
    backgroundColor: colors.canvas,
  },
  inputWrap: {
    flex: 1,
  },
})
