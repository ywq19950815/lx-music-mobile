import { forwardRef, useImperativeHandle, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

import SourceSelector, {
  type SourceSelectorType,
} from './SourceSelector'
import ActiveListName, { type ActiveListNameType } from './ActiveListName'
import { neoColors } from '@/theme/neobrutalism'

export interface HeaderBarProps {
  onShowBound: () => void
  onSourceChange: (source: LX.OnlineSource) => void
}

export interface HeaderBarType {
  setBound: (source: LX.OnlineSource, id: string, name: string) => void
}

export default forwardRef<HeaderBarType, HeaderBarProps>(({ onShowBound, onSourceChange }, ref) => {
  const activeListNameRef = useRef<ActiveListNameType>(null)
  const sourceSelectorRef = useRef<SourceSelectorType>(null)

  useImperativeHandle(ref, () => ({
    setBound(source, id, name) {
      sourceSelectorRef.current?.setSource(source)
      activeListNameRef.current?.setBound(id, name)
    },
  }), [])

  return (
    <View style={styles.headerBar}>
      <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} />
      <ActiveListName ref={activeListNameRef} onShowBound={onShowBound} />
    </View>
  )
})

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    // 修正笔误：主题里没有 bgCream，实际应是 cream（否则底色为 undefined → 透明）
    backgroundColor: neoColors.cream,
    borderBottomWidth: 2.5,
    borderBottomColor: neoColors.black,
    zIndex: 2,
  },
})
