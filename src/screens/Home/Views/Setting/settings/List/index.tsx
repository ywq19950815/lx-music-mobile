import { memo, useMemo } from 'react'
import Section from '../../components/Section'
import { SettingSwitchRow, SettingPillSelectRow, type PillOption } from '../../components/SettingRow'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()
  const isClickPlayList = useSettingValue('list.isClickPlayList')
  const isShowAlbumName = useSettingValue('list.isShowAlbumName')
  const isShowInterval = useSettingValue('list.isShowInterval')
  const addMusicLocationType = useSettingValue('list.addMusicLocationType')

  const locationOptions = useMemo<PillOption<LX.AddMusicLocationType>[]>(() => [
    { label: t('setting_list_add_music_location_type_top'), value: 'top' },
    { label: t('setting_list_add_music_location_type_bottom'), value: 'bottom' },
  ], [t])

  return (
    <Section title={t('setting_list')} icon="list-order">
      <SettingSwitchRow
        title={t('setting_list_click_action')}
        desc="开启后点击单曲将替换当前播放列表为整张歌单"
        value={isClickPlayList}
        onValueChange={(val) => updateSetting({ 'list.isClickPlayList': val })}
      />
      <SettingSwitchRow
        title={t('setting_list_show_album_name')}
        desc="在歌单与搜索结果列表的歌曲副标题中展示专辑名称"
        value={isShowAlbumName}
        onValueChange={(val) => updateSetting({ 'list.isShowAlbumName': val })}
      />
      <SettingSwitchRow
        title={t('setting_list_show interval')}
        desc="在单曲右侧副信息区常驻展示音频时长"
        value={isShowInterval}
        onValueChange={(val) => updateSetting({ 'list.isShowInterval': val })}
      />
      <SettingPillSelectRow
        title={t('setting_list_add_music_location_type')}
        desc="新收藏或添加的歌曲插入到当前歌单的位置"
        options={locationOptions}
        currentValue={addMusicLocationType}
        onSelect={(val) => updateSetting({ 'list.addMusicLocationType': val })}
        isLast
      />
    </Section>
  )
})
