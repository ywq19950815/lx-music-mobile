import { memo, useCallback, useState } from 'react'
import { View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import Slider, { type SliderProps } from '../../components/Slider'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { colors } from '@/theme/tokens'
import { setDesktopLyricMaxLineNum } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'


export default memo(() => {
  const t = useI18n()
  const maxLineNum = useSettingValue('desktopLyric.maxLineNum')
  const [sliderSize, setSliderSize] = useState(maxLineNum)
  const [isSliding, setSliding] = useState(false)
  const handleSlidingStart = useCallback<NonNullable<SliderProps['onSlidingStart']>>(() => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback<NonNullable<SliderProps['onValueChange']>>(value => {
    setSliderSize(value)
  }, [])
  const handleSlidingComplete = useCallback<NonNullable<SliderProps['onSlidingComplete']>>(value => {
    if (maxLineNum == value) return
    void setDesktopLyricMaxLineNum(value).then(() => {
      updateSetting({ 'desktopLyric.maxLineNum': value })
    }).finally(() => {
      setSliding(false)
    })
  }, [maxLineNum])

  return (
    <SubTitle title={t('setting_lyric_desktop_maxlineNum')}>
      <View style={styles.content}>
        {/* 不用 theme['c-primary-font']：该色在浅色主题下是 rgb(190,190,190)，落在纯白卡片上
            对比度仅 1.86:1，作为数值回显几乎看不清。改用纯黑加粗。 */}
        <Text style={styles.valueText}>{isSliding ? sliderSize : maxLineNum}</Text>
        <Slider
          minimumValue={1}
          maximumValue={8}
          onSlidingComplete={handleSlidingComplete}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          step={1}
          value={maxLineNum}
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
    color: colors.ink,
    fontWeight: '700',
  },
})
