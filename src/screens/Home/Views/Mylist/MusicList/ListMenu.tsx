import { useRef, useImperativeHandle, forwardRef } from 'react'
import MusicActionSheet, { type MusicActionSheetType, type MusicActionSheetSelectInfo } from '@/components/common/MusicActionSheet'
import { type Position } from '@/components/common/Menu'

export type SelectInfo = MusicActionSheetSelectInfo

export interface ListMenuProps {
  onPlay: (selectInfo: SelectInfo) => void
  onPlayLater: (selectInfo: SelectInfo) => void
  onAdd: (selectInfo: SelectInfo) => void
  onMove: (selectInfo: SelectInfo) => void
  onEditMetadata: (selectInfo: SelectInfo) => void
  onChangePosition: (selectInfo: SelectInfo) => void
  onToggleSource: (selectInfo: SelectInfo) => void
  onMusicSourceDetail: (selectInfo: SelectInfo) => void
  onRemoveCache: (selectInfo: SelectInfo) => void
  onDislikeMusic: (selectInfo: SelectInfo) => void
  onRemove: (selectInfo: SelectInfo) => void
}
export interface ListMenuType {
  show: (selectInfo: SelectInfo, position?: Position) => void
}

export type {
  Position,
}

export default forwardRef<ListMenuType, ListMenuProps>((props, ref) => {
  const actionSheetRef = useRef<MusicActionSheetType>(null)

  useImperativeHandle(ref, () => ({
    show(selectInfo, position) {
      console.log('--- [ListMenu] show called with:', selectInfo?.musicInfo?.name, 'hasActionSheetRef:', !!actionSheetRef.current)
      actionSheetRef.current?.show(selectInfo, position)
    },
  }))

  return (
    <MusicActionSheet ref={actionSheetRef} {...props} />
  )
})
