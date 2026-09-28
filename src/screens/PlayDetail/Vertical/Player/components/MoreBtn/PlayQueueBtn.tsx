import { memo } from 'react'
import Btn from './Btn'

export default memo(() => {
  const handleOpenPlayQueue = () => {
    globalThis.app_event?.emit('openPlayQueue')
  }

  return <Btn icon="list-order" onPress={handleOpenPlayQueue} />
})
