import { memo, useCallback, useState } from 'react'
import { View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import Slider, { type SliderProps } from '../../components/Slider'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { neoColors } from '@/theme/neobrutalism'
import { setDesktopLyricAlpha } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'


export default memo(() => {
  const t = useI18n()
  const opacity = useSettingValue('desktopLyric.style.opacity')
  const [sliderSize, setSliderSize] = useState(opacity)
  const [isSliding, setSliding] = useState(false)
  const handleSlidingStart = useCallback<NonNullable<SliderProps['onSlidingStart']>>(() => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback<NonNullable<SliderProps['onValueChange']>>(value => {
    setSliderSize(value)
  }, [])
  const handleSlidingComplete = useCallback<NonNullable<SliderProps['onSlidingComplete']>>(value => {
    if (opacity == value) return
    void setDesktopLyricAlpha(value).then(() => {
      updateSetting({ 'desktopLyric.style.opacity': value })
    }).finally(() => {
      setSliding(false)
    })
  }, [opacity])

  return (
    <SubTitle title={t('setting_lyric_desktop_text_opacity')}>
      <View style={styles.content}>
        {/* 不用 theme['c-primary-font']：该色在浅色主题下是 rgb(190,190,190)，落在纯白卡片上
            对比度仅 1.86:1，作为数值回显几乎看不清。改用纯黑加粗。 */}
        <Text style={styles.valueText}>{isSliding ? sliderSize : opacity}</Text>
        <Slider
          minimumValue={10}
          maximumValue={100}
          onSlidingComplete={handleSlidingComplete}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          step={2}
          value={opacity}
        />
      </View>
    </SubTitle>
  )
})

const styles = createStyle({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  valueText: {
    color: neoColors.black,
    fontWeight: '800',
  },
})

