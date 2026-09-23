import { useRef, useImperativeHandle, forwardRef } from 'react'
import MusicActionSheet, { type MusicActionSheetType, type MusicActionSheetSelectInfo } from '@/components/common/MusicActionSheet'
import { type Position } from '@/components/common/Menu'

export interface SelectInfo {
  musicInfo: LX.Music.MusicInfoOnline
  selectedList: LX.Music.MusicInfoOnline[]
  index: number
  single: boolean
}

export interface ListMenuProps {
  onPlay: (selectInfo: SelectInfo) => void
  onPlayLater: (selectInfo: SelectInfo) => void
  onAdd: (selectInfo: SelectInfo) => void
  onCopyName: (selectInfo: SelectInfo) => void
  onMusicSourceDetail: (selectInfo: SelectInfo) => void
  onRemoveCache: (selectInfo: SelectInfo) => void
  onDislikeMusic: (selectInfo: SelectInfo) => void
}
export interface ListMenuType {
  show: (selectInfo: SelectInfo, position?: Position) => void
}

export type {
  Position,
}

export default forwardRef<ListMenuType, ListMenuProps>((props: ListMenuProps, ref) => {
  const actionSheetRef = useRef<MusicActionSheetType>(null)

  useImperativeHandle(ref, () => ({
    show(selectInfo, position) {
      actionSheetRef.current?.show(selectInfo, position)
    },
  }))

  return (
    <MusicActionSheet ref={actionSheetRef} {...props} />
  )
})
