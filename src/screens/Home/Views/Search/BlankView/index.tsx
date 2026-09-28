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
  show: (source: Source, type?: 'music' | 'songlist') => void
}

export default forwardRef<BlankViewType, BlankViewProps>(({ onSearch }, ref) => {
  const [visible, setVisible] = useState(false)
  const [activeType, setActiveType] = useState<'music' | 'songlist'>('music')
  const hotSearchRef = useRef<HotSearchType>(null)
  const historySearchRef = useRef<HistorySearchType>(null)
  const isShowHistorySearch = useSettingValue('search.isShowHistorySearch')

  const handleShow = (source: Source, type: 'music' | 'songlist' = 'music') => {
    setActiveType(type)
    if (type === 'music') {
      hotSearchRef.current?.show(source)
      historySearchRef.current?.show()
    }
  }

  useImperativeHandle(ref, () => ({
    show(source, type = 'music') {
      if (visible) handleShow(source, type)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow(source, type)
        })
      }
    },
  }), [visible])

  if (!visible) return null

  // 歌曲激活：展示纯粹的单曲热门搜索与历史搜索
  if (activeType === 'music') {
    return (
      <ScrollView style={styles.musicScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.musicContent}>
        <HotSearch ref={hotSearchRef} onSearch={onSearch} />
        {isShowHistorySearch ? <HistorySearch ref={historySearchRef} onSearch={onSearch} /> : null}
      </ScrollView>
    )
  }

  // 歌单激活：展示纯粹的在线歌单广场（包含分类抽屉与歌单网格）
  return (
    <View style={styles.songlistArea}>
      <SongList />
    </View>
  )
})

const styles = createStyle({
  musicScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  musicContent: {
    paddingBottom: 25,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 8,
  },
  songlistArea: {
    flex: 1,
    minHeight: 0,
  },
})
