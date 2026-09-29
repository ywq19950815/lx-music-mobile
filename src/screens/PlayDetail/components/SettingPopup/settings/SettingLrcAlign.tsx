import { useMemo } from 'react'

import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { SheetSegmentRow } from './ui'

type Align_Type = LX.AppSetting['playDetail.style.align']

const ALIGN_LIST = [
  'left',
  'center',
  'right',
] as const

export default () => {
  const t = useI18n()
  const list = useMemo(() => {
    return ALIGN_LIST.map(id => ({ value: id, label: t(`play_detail_setting_lrc_align_${id}`) }))
  }, [t])

  const setPosition = (id: Align_Type) => {
    updateSetting({ 'playDetail.style.align': id })
  }

  return (
    <SheetSegmentRow
      title={t('play_detail_setting_lrc_align')}
      options={list}
      currentValue={useSettingValue('playDetail.style.align')}
      onSelect={setPosition}
    />
  )
}
