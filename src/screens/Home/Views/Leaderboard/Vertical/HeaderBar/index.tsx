import { forwardRef, useImperativeHandle, useRef } from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'

import SourceSelector, {
  type SourceSelectorType,
} from './SourceSelector'
import ActiveListName, { type ActiveListNameType } from './ActiveListName'
import { colors } from '@/theme/tokens'

export interface HeaderBarProps {
  onShowBound: () => void
  onSourceChange: (source: LX.OnlineSource) => void
  isDetailView?: boolean
  onBackToGallery?: () => void
}

export interface HeaderBarType {
  setBound: (source: LX.OnlineSource, id: string, name: string) => void
}

export default forwardRef<HeaderBarType, HeaderBarProps>(({ onShowBound, onSourceChange, isDetailView, onBackToGallery }, ref) => {
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
      <View style={styles.leftGroup}>
        {isDetailView && onBackToGallery ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBackToGallery} activeOpacity={0.7}>
            <Icon name="chevron-left" size={15} color={colors.ink} />
            <Text style={styles.backBtnText}>大盘</Text>
          </TouchableOpacity>
        ) : null}
        <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} />
      </View>
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
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    zIndex: 2,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
})
