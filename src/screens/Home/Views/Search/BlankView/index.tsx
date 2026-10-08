import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import HistorySearch, { type HistorySearchType } from './HistorySearch'
import HotSearch, { type HotSearchType } from './HotSearch'
import DiscoverHome from './DiscoverHome'

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
  const historySearchRef = useRef<HistorySearchType>(null)
  const isShowHistorySearch = useSettingValue('search.isShowHistorySearch')

  const handleShow = (source: Source) => {
    hotSearchRef.current?.show(source)
    historySearchRef.current?.show()
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
      <DiscoverHome onSearch={onSearch} />
      <HotSearch ref={hotSearchRef} onSearch={onSearch} />
      {isShowHistorySearch ? <HistorySearch ref={historySearchRef} onSearch={onSearch} /> : null}
    </ScrollView>
  )
})

const styles = createStyle({
  musicScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  musicContent: {
    paddingBottom: 25,
    paddingTop: 4,
  },
})
