import { memo } from 'react'
import Btn from './Btn'

export default memo(() => {
  const handleOpenPlayQueue = () => {
    global.app_event.openPlayQueue()
  }

  return <Btn icon="list-order" onPress={handleOpenPlayQueue} />
})
