import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'

import CheckBoxItem from '../../components/CheckBoxItem'
import { setDesktopLyricIsKaraoke } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const isKaraoke = useSettingValue('desktopLyric.isKaraoke')
  const update = (isKaraoke: boolean) => {
    void setDesktopLyricIsKaraoke(isKaraoke).then(() => {
      updateSetting({ 'desktopLyric.isKaraoke': isKaraoke })
    })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isKaraoke} onChange={update} label={t('setting_lyric_desktop_karaoke')} />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
    marginBottom: 15,
  },
})
