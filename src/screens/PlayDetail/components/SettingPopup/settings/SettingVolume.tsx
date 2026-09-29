import { useState } from 'react'

import { useSettingValue } from '@/store/setting/hook'
import Slider, { type SliderProps } from '@/components/common/Slider'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { setVolume } from '@/plugins/player'
import { SheetSliderRow } from './ui'


const Volume = () => {
  const volume = Math.trunc(useSettingValue('player.volume') * 100)
  const [sliderSize, setSliderSize] = useState(volume)
  const [isSliding, setSliding] = useState(false)
  const t = useI18n()

  const handleSlidingStart: SliderProps['onSlidingStart'] = () => {
    setSliding(true)
  }
  const handleValueChange: SliderProps['onValueChange'] = value => {
    value = Math.trunc(value)
    setSliderSize(value)
    void setVolume(value / 100)
  }
  const handleSlidingComplete: SliderProps['onSlidingComplete'] = value => {
    setSliding(false)
    value = Math.trunc(value)
    if (volume == value) return
    updateSetting({ 'player.volume': value / 100 })
  }

  return (
    <SheetSliderRow
      title={t('play_detail_setting_volume')}
      valueText={`${isSliding ? sliderSize : volume}`}
      minimumValue={0}
      maximumValue={100}
      onSlidingComplete={handleSlidingComplete}
      onValueChange={handleValueChange}
      onSlidingStart={handleSlidingStart}
      step={1}
      value={volume}
    />
  )
}

export default Volume
