import { memo, useRef } from 'react'
import { View } from 'react-native'

import Section from '../../components/Section'
import { SwitchRow, SliderRow, SegmentRow, GroupTitle } from './parts'
import Theme from './Theme'
import DesktopLyricEnable, { type DesktopLyricEnableType } from '@/components/DesktopLyricEnable'

import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { createStyle } from '@/utils/tools'
import {
  toggleDesktopLyricLock,
  setShowDesktopLyricToggleAnima,
  setDesktopLyricSingleLine,
  setDesktopLyricIsKaraoke,
  setDesktopLyricTextSize,
  setDesktopLyricWidth,
  setDesktopLyricMaxLineNum,
  setDesktopLyricAlpha,
  setDesktopLyricTextPosition,
} from '@/core/desktopLyric'

type PositionX = LX.AppSetting['desktopLyric.textPosition.x']
type PositionY = LX.AppSetting['desktopLyric.textPosition.y']

const X_LIST = ['left', 'center', 'right'] as const
const Y_LIST = ['top', 'center', 'bottom'] as const

export default memo(() => {
  const t = useI18n()
  const isEnable = useSettingValue('desktopLyric.enable')
  const isLock = useSettingValue('desktopLyric.isLock')
  const showToggleAnima = useSettingValue('desktopLyric.showToggleAnima')
  const isSingleLine = useSettingValue('desktopLyric.isSingleLine')
  const isKaraoke = useSettingValue('desktopLyric.isKaraoke')
  const fontSize = useSettingValue('desktopLyric.style.fontSize')
  const width = useSettingValue('desktopLyric.width')
  const maxLineNum = useSettingValue('desktopLyric.maxLineNum')
  const opacity = useSettingValue('desktopLyric.style.opacity')
  const positionX = useSettingValue('desktopLyric.textPosition.x')
  const positionY = useSettingValue('desktopLyric.textPosition.y')
  const desktopLyricEnableRef = useRef<DesktopLyricEnableType>(null)

  const xList = [
    { id: 'left' as PositionX, label: t('setting_lyric_desktop_text_x_left') },
    { id: 'center' as PositionX, label: t('setting_lyric_desktop_text_x_center') },
    { id: 'right' as PositionX, label: t('setting_lyric_desktop_text_x_right') },
  ]
  const yList = [
    { id: 'top' as PositionY, label: t('setting_lyric_desktop_text_y_top') },
    { id: 'center' as PositionY, label: t('setting_lyric_desktop_text_y_center') },
    { id: 'bottom' as PositionY, label: t('setting_lyric_desktop_text_y_bottom') },
  ]

  const handleLockChange = (lock: boolean) => {
    void toggleDesktopLyricLock(lock).then(() => {
      updateSetting({ 'desktopLyric.isLock': lock })
    })
  }
  const handleToggleAnimaChange = (show: boolean) => {
    void setShowDesktopLyricToggleAnima(show).then(() => {
      updateSetting({ 'desktopLyric.showToggleAnima': show })
    })
  }
  const handleSingleLineChange = (single: boolean) => {
    void setDesktopLyricSingleLine(single).then(() => {
      updateSetting({ 'desktopLyric.isSingleLine': single })
    })
  }
  const handleKaraokeChange = (karaoke: boolean) => {
    void setDesktopLyricIsKaraoke(karaoke).then(() => {
      updateSetting({ 'desktopLyric.isKaraoke': karaoke })
    })
  }
  const handleSizeChange = (size: number) => {
    void setDesktopLyricTextSize(size).then(() => {
      updateSetting({ 'desktopLyric.style.fontSize': size })
    })
  }
  const handleWidthChange = (w: number) => {
    void setDesktopLyricWidth(w).then(() => {
      updateSetting({ 'desktopLyric.width': w })
    })
  }
  const handleMaxLineChange = (num: number) => {
    void setDesktopLyricMaxLineNum(num).then(() => {
      updateSetting({ 'desktopLyric.maxLineNum': num })
    })
  }
  const handleOpacityChange = (o: number) => {
    void setDesktopLyricAlpha(o).then(() => {
      updateSetting({ 'desktopLyric.style.opacity': o })
    })
  }
  const handlePositionXChange = (id: PositionX) => {
    void setDesktopLyricTextPosition(id, null).then(() => {
      updateSetting({ 'desktopLyric.textPosition.x': id })
    })
  }
  const handlePositionYChange = (id: PositionY) => {
    void setDesktopLyricTextPosition(null, id).then(() => {
      updateSetting({ 'desktopLyric.textPosition.y': id })
    })
  }

  return (
    <Section title={t('setting_lyric_desktop')} icon="lyric-on">
      <View>
        <SwitchRow
          label={t('setting_lyric_desktop_enable')}
          value={isEnable}
          onChange={enable => { desktopLyricEnableRef.current?.setEnabled(enable) }}
        />
        <DesktopLyricEnable ref={desktopLyricEnableRef} />
      </View>

      <GroupTitle title={t('setting_lyric_desktop_group_display')} />
      <View style={styles.group}>
        <SwitchRow label={t('setting_lyric_desktop_lock')} value={isLock} onChange={handleLockChange} />
        <SwitchRow label={t('setting_lyric_desktop_toggle_anima')} value={showToggleAnima} onChange={handleToggleAnimaChange} />
        <SwitchRow label={t('setting_lyric_desktop_single_line')} value={isSingleLine} onChange={handleSingleLineChange} />
        <SwitchRow label={t('setting_lyric_desktop_karaoke')} value={isKaraoke} onChange={handleKaraokeChange} last />
      </View>

      <Theme />

      <GroupTitle title={t('setting_lyric_desktop_group_style')} />
      <SliderRow
        title={t('setting_lyric_desktop_text_size')}
        value={fontSize}
        minimumValue={100}
        maximumValue={500}
        step={2}
        onCommit={handleSizeChange}
      />
      <SliderRow
        title={t('setting_lyric_desktop_view_width')}
        value={width}
        minimumValue={10}
        maximumValue={100}
        step={1}
        onCommit={handleWidthChange}
      />
      <SliderRow
        title={t('setting_lyric_desktop_text_opacity')}
        value={opacity}
        minimumValue={10}
        maximumValue={100}
        step={2}
        onCommit={handleOpacityChange}
      />
      <SliderRow
        title={t('setting_lyric_desktop_maxlineNum')}
        value={maxLineNum}
        minimumValue={1}
        maximumValue={8}
        step={1}
        onCommit={handleMaxLineChange}
      />

      <SegmentRow title={t('setting_lyric_desktop_text_x')} list={xList} value={positionX} onChange={handlePositionXChange} />
      <SegmentRow title={t('setting_lyric_desktop_text_y')} list={yList} value={positionY} onChange={handlePositionYChange} />
    </Section>
  )
})

const styles = createStyle({
  group: {
    marginHorizontal: -2,
  },
})
