import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView } from 'react-native'
import { createStyle } from '@/utils/tools'
import HotSearch, { type HotSearchType } from './HotSearch'

interface BlankViewProps {
  onSearch: (keyword: string) => void
}
type Source = LX.OnlineSource | 'all'

export interface BlankViewType {
  show: (source: Source) => void
}

export default forwardRef<BlankViewType, BlankViewProps>(({ onSearch }, ref) => {
  const [visible, setVisible] = useState(false)
  const hotSearchRef = useRef<HotSearchType>(null)

  const handleShow = (source: Source) => {
    hotSearchRef.current?.show(source)
  }

  useImperativeHandle(ref, () => ({
    show(source) {
      if (visible) handleShow(source)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow(source)
        })
      }
    },
  }), [visible])

  if (!visible) return null

  return (
    <ScrollView style={styles.musicScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.musicContent}>
      <HotSearch ref={hotSearchRef} onSearch={onSearch} />
    </ScrollView>
  )
})

const styles = createStyle({
  musicScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  musicContent: {
    paddingBottom: 40,
    paddingTop: 16,
  },
})
