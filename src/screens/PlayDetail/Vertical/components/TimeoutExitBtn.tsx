import { memo, useRef } from 'react'
import TimeoutExitEditModal, { type TimeoutExitEditModalType, useTimeInfo } from '@/components/TimeoutExitEditModal'
import { neoColors } from '@/theme/neobrutalism'
import Btn from './Btn'

export default memo(() => {
  const modalRef = useRef<TimeoutExitEditModalType>(null)
  const timeInfo = useTimeInfo()

  const handleShow = () => {
    modalRef.current?.show()
  }

  return (
    <>
      <Btn
        icon="music_time"
        bg={timeInfo.active ? neoColors.pink : neoColors.white}
        color={neoColors.black}
        onPress={handleShow}
      />
      <TimeoutExitEditModal ref={modalRef} timeInfo={timeInfo} />
    </>
  )
})
