import { memo, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import Section from '../../components/Section'
import { SettingSwitchRow, SettingPillSelectRow, type PillOption } from '../../components/SettingRow'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { toast } from '@/utils/tools'

export default memo(() => {
  const t = useI18n()

  // 1. 播放与音质相关
  const playQuality = useSettingValue('player.playQuality')
  const isSavePlayTime = useSettingValue('player.isSavePlayTime')
  const isEnableAudioOffload = useSettingValue('player.isEnableAudioOffload')
  const isHandleAudioFocus = useSettingValue('player.isHandleAudioFocus')

  // 2. 歌词与界面展示
  const isShowLyricTranslation = useSettingValue('player.isShowLyricTranslation')
  const isShowLyricRoma = useSettingValue('player.isShowLyricRoma')
  const isS2T = useSettingValue('player.isS2T')
  const isShowNotificationImage = useSettingValue('player.isShowNotificationImage')

  // 3. 车载与蓝牙
  const isShowBluetoothLyric = useSettingValue('player.isShowBluetoothLyric')
  const isShowBluetoothFullLyric = useSettingValue('player.isShowBluetoothFullLyric')

  // 4. 播放列表与缓存
  const isAutoCleanPlayedList = useSettingValue('player.isAutoCleanPlayedList')
  const cacheSize = useSettingValue('player.cacheSize')

  // 音质选择选项
  const qualityOptions = useMemo<PillOption<LX.Quality>[]>(() => [
    { label: '标准', value: '128k', badge: '128K' },
    { label: '高品质', value: '320k', badge: '320K' },
    { label: '无损品质', value: 'flac', badge: 'FLAC' },
    { label: 'Hi-Res母带', value: 'flac24bit', badge: '24Bit' },
  ], [])

  // 缓存上限选项（MiB）
  const cacheOptions = useMemo<PillOption<string>[]>(() => [
    { label: '禁用缓存', value: '0' },
    { label: '512 MB', value: '512' },
    { label: '1 GB', value: '1024' },
    { label: '2 GB', value: '2048' },
    { label: '4 GB', value: '4096' },
  ], [])

  const currentCacheVal = useMemo(() => {
    const val = String(cacheSize || '0')
    const match = cacheOptions.find(o => o.value === val)
    return match ? val : '1024'
  }, [cacheSize, cacheOptions])

  return (
    <View style={styles.container}>
      {/* ── 模块 1：播放体验与音质 ────────────────────────────── */}
      <Section title="播放与音质" icon="play">
        <SettingPillSelectRow
          title={t('setting_play_play_quality')}
          desc="选择默认首选音频规格，音源未提供时将自动平滑降级"
          options={qualityOptions}
          currentValue={playQuality}
          onSelect={(q) => updateSetting({ 'player.playQuality': q })}
        />

        <SettingSwitchRow
          title={t('setting_play_save_play_time')}
          desc="下次启动应用时，自动恢复最后播放歌曲的进度"
          value={isSavePlayTime}
          onValueChange={(val) => updateSetting({ 'player.isSavePlayTime': val })}
        />

        <SettingSwitchRow
          title={t('setting_play_audio_offload')}
          desc="启用硬件级音频卸载，大幅降低后台播放电量消耗"
          helpTitle={t('setting_play_audio_offload')}
          helpDesc={t('setting_play_audio_offload_tip')}
          value={isEnableAudioOffload}
          onValueChange={(val) => updateSetting({ 'player.isEnableAudioOffload': val })}
        />

        <SettingSwitchRow
          title="与其他音频混音/焦点控制"
          desc="当其他应用（如视频、通话或导航）发声时自动暂停播放"
          helpTitle="音频焦点控制"
          helpDesc={t('setting_play_handle_audio_focus_tip')}
          value={isHandleAudioFocus}
          onValueChange={(val) => updateSetting({ 'player.isHandleAudioFocus': val })}
          isLast
        />
      </Section>

      {/* ── 模块 2：歌词与显示 ──────────────────────────────── */}
      <Section title="歌词与显示" icon="comment">
        <SettingSwitchRow
          title={t('setting_play_show_translation')}
          desc="当音源提供多语言翻译歌词时，在主歌词下方同步显示"
          value={isShowLyricTranslation}
          onValueChange={(val) => updateSetting({ 'player.isShowLyricTranslation': val })}
        />

        <SettingSwitchRow
          title={t('setting_play_show_roma')}
          desc="当音源提供日韩语罗马音时，在歌词上方提供注音"
          value={isShowLyricRoma}
          onValueChange={(val) => updateSetting({ 'player.isShowLyricRoma': val })}
        />

        <SettingSwitchRow
          title="歌词简繁自动转换"
          desc="将当前播放的歌词文本自动转为繁体中文展示"
          value={isS2T}
          onValueChange={(val) => updateSetting({ 'player.isS2T': val })}
        />

        <SettingSwitchRow
          title="通知栏专辑封面大图"
          desc="在系统下拉通知栏与锁屏播放器中渲染高清专辑大图"
          value={isShowNotificationImage}
          onValueChange={(val) => updateSetting({ 'player.isShowNotificationImage': val })}
          isLast
        />
      </Section>

      {/* ── 模块 3：车载与蓝牙协同 ──────────────────────────── */}
      <Section title="车载与蓝牙协同" icon="sync">
        <SettingSwitchRow
          title={t('setting_play_show_bluetooth_lyric')}
          desc="通过标准 AVRCP 协议向蓝牙耳机或车载屏幕同步滚动歌词"
          value={isShowBluetoothLyric}
          onValueChange={(val) => updateSetting({ 'player.isShowBluetoothLyric': val })}
        />

        <SettingSwitchRow
          title={t('setting_play_show_bluetooth_full_lyric')}
          desc="向大屏车机发送多行上下文歌词（需车机中控系统完整支持）"
          value={isShowBluetoothFullLyric}
          onValueChange={(val) => updateSetting({ 'player.isShowBluetoothFullLyric': val })}
          isLast
        />
      </Section>

      {/* ── 模块 4：播放列表与存储缓存 ──────────────────────── */}
      <Section title="播放列表与缓存" icon="menu">
        <SettingSwitchRow
          title={t('setting_play_auto_clean_played_list')}
          desc="换歌或随机播放时，已播放的歌曲自动重新进入随机池"
          helpTitle={t('setting_play_auto_clean_played_list')}
          helpDesc={t('setting_play_auto_clean_played_list_tip')}
          value={isAutoCleanPlayedList}
          onValueChange={(val) => updateSetting({ 'player.isAutoCleanPlayedList': val })}
        />

        <SettingPillSelectRow
          title={t('setting_play_cache_size')}
          desc="在线歌曲边听边存的上限容量，超出后自动淘汰最早缓存"
          options={cacheOptions}
          currentValue={currentCacheVal}
          onSelect={(size) => {
            updateSetting({ 'player.cacheSize': size })
            toast(t('setting_play_cache_size_save_tip'))
          }}
          isLast
        />
      </Section>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
})
