import { useState } from 'react'

import { useSettingValue } from '@/store/setting/hook'
import Slider, { type SliderProps } from '@/components/common/Slider'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { SheetSliderRow } from './ui'


const LrcFontSize = ({ direction }: {
  direction: 'horizontal' | 'vertical'
}) => {
  const settingKey = direction == 'horizontal' ? 'playDetail.horizontal.style.lrcFontSize' : 'playDetail.vertical.style.lrcFontSize'
  const lrcFontSize = useSettingValue(settingKey)
  const [sliderSize, setSliderSize] = useState(lrcFontSize)
  const [isSliding, setSliding] = useState(false)
  const t = useI18n()

  const handleSlidingStart: SliderProps['onSlidingStart'] = () => {
    setSliding(true)
  }
  const handleValueChange: SliderProps['onValueChange'] = value => {
    setSliderSize(value)
  }
  const handleSlidingComplete: SliderProps['onSlidingComplete'] = value => {
    setSliding(false)
    if (lrcFontSize == value) return
    updateSetting({ [settingKey]: value })
  }

  return (
    <SheetSliderRow
      title={t('play_detail_setting_lrc_font_size')}
      valueText={`${isSliding ? sliderSize : lrcFontSize}`}
      minimumValue={100}
      maximumValue={300}
      onSlidingComplete={handleSlidingComplete}
      onValueChange={handleValueChange}
      onSlidingStart={handleSlidingStart}
      step={2}
      value={lrcFontSize}
    />
  )
}

export default LrcFontSize
