import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { SheetSwitchRow } from './ui'


export default () => {
  const t = useI18n()
  const isShowLyricProgressSetting = useSettingValue('playDetail.isShowLyricProgressSetting')
  const setShowLyricProgressSetting = (showLyricProgressSetting: boolean) => {
    updateSetting({ 'playDetail.isShowLyricProgressSetting': showLyricProgressSetting })
  }

  return (
    <SheetSwitchRow
      title={t('play_detail_setting_show_lyric_progress_setting')}
      value={isShowLyricProgressSetting}
      onValueChange={setShowLyricProgressSetting}
    />
  )
}
