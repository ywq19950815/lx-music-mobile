import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
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

  return (
    visible
      ? (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <DiscoverHome onSearch={onSearch} />
            <View style={styles.content}>
              <HotSearch ref={hotSearchRef} onSearch={onSearch} />
              { isShowHistorySearch ? <HistorySearch ref={historySearchRef} onSearch={onSearch} /> : null }
            </View>
          </ScrollView>
        )
      : null
  )
})

const styles = createStyle({
  content: {
    paddingBottom: 15,
    paddingLeft: 15,
    paddingRight: 15,
  },
  welcome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
