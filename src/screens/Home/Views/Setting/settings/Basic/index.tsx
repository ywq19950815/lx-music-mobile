import { memo } from 'react'
import { View, StyleSheet } from 'react-native'

import Section from '../../components/Section'
import Source from './Source'
import SourceName from './SourceName'
import Language from './Language'
import FontSize from './FontSize'
import IsStartupAutoPlay from './IsStartupAutoPlay'
import IsStartupPushPlayDetailScreen from './IsStartupPushPlayDetailScreen'
import IsAutoHidePlayBar from './IsAutoHidePlayBar'
import IsHomePageScroll from './IsHomePageScroll'
import IsAllowProgressBarSeek from './IsAllowProgressBarSeek'
import IsUseSystemFileSelector from './IsUseSystemFileSelector'
import IsAlwaysKeepStatusbarHeight from './IsAlwaysKeepStatusbarHeight'
import IsShowBackBtn from './IsShowBackBtn'
import IsShowExitBtn from './IsShowExitBtn'

export default memo(() => {
  return (
    <View style={styles.container}>
      <Section title="常规与交互" icon="setting">
        <IsStartupAutoPlay />
        <IsStartupPushPlayDetailScreen />
        <IsShowBackBtn />
        <IsShowExitBtn />
        <IsAutoHidePlayBar />
        <IsHomePageScroll />
        <IsAllowProgressBarSeek />
        <IsUseSystemFileSelector />
        <IsAlwaysKeepStatusbarHeight />
      </Section>

      <Section title="界面与显示" icon="theme">
        <Language />
        <FontSize />
        <SourceName />
      </Section>

      <Section title="音源服务" icon="play">
        <Source />
      </Section>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
})
