import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import HistorySearch, { type HistorySearchType } from './HistorySearch'
import HotSearch, { type HotSearchType } from './HotSearch'
import SongList from '@/screens/Home/Views/SongList'

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
          <View style={styles.container}>
            {/* 顶部：热门搜索 + 历史搜索（内容较短，超长内部滚动） */}
            <ScrollView style={styles.topArea} showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                <HotSearch ref={hotSearchRef} onSearch={onSearch} />
                { isShowHistorySearch ? <HistorySearch ref={historySearchRef} onSearch={onSearch} /> : null }
              </View>
            </ScrollView>
            {/* 底部：在线歌单浏览（来自原「歌单」Tab，已合并进来） */}
            <View style={styles.songlistArea}>
              <SongList />
            </View>
          </View>
        )
      : null
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    minHeight: 0,
  },
  topArea: {
    maxHeight: 260,
    flexGrow: 0,
    flexShrink: 0,
  },
  content: {
    paddingBottom: 15,
    paddingLeft: 15,
    paddingRight: 15,
  },
  songlistArea: {
    flex: 1,
    minHeight: 0,
  },
  welcome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
