import { memo, useRef } from 'react'
import TimeoutExitEditModal, { type TimeoutExitEditModalType, useTimeInfo } from '@/components/TimeoutExitEditModal'
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
        bg={timeInfo.active ? '#F5A623' : undefined}
        color={timeInfo.active ? '#FFFFFF' : undefined}
        onPress={handleShow}
      />
      <TimeoutExitEditModal ref={modalRef} timeInfo={timeInfo} />
    </>
  )
})
