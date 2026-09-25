import { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import Text from '@/components/common/Text'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { toast } from '@/utils/tools'
import {
  cancelTimeoutExit,
  getTimeoutExitTime,
  onTimeUpdate,
  startTimeoutExit,
  stopTimeoutExit,
  useTimeoutExitTimeInfo,
} from '@/core/player/timeoutExit'
import { useI18n } from '@/lang'
import CheckBox from './common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import settingState from '@/store/setting/state'
import { colors, radius } from '@/theme/tokens'

const MAX_MIN = 1440
const rxp = /([1-9]\d*)/
const PRESET_MINUTES = [15, 30, 45, 60, 90]

const formatTime = (time: number) => {
  let h = Math.trunc(time / 3600)
  let hStr = h ? h.toString() + ':' : ''
  time = time % 3600
  const m = Math.trunc(time / 60).toString().padStart(2, '0')
  const s = Math.trunc(time % 60).toString().padStart(2, '0')
  return `${hStr}${m}:${s}`
}

export const useTimeInfo = () => {
  const [exitTimeInfo, setExitTimeInfo] = useState({
    cancelText: '',
    confirmText: '',
    isPlayedStop: false,
    active: false,
  })
  const t = useI18n()

  useEffect(() => {
    let active: boolean | null = null
    const remove = onTimeUpdate((time, isPlayedStop) => {
      if (time < 0) {
        if (active) {
          setExitTimeInfo({
            cancelText: isPlayedStop ? t('timeout_exit_btn_wait_cancel') : '',
            confirmText: '',
            isPlayedStop,
            active: false,
          })
          active = false
        }
      } else {
        if (active !== true) {
          setExitTimeInfo({
            cancelText: t('timeout_exit_btn_cancel'),
            confirmText: t('timeout_exit_btn_update'),
            isPlayedStop,
            active: true,
          })
          active = true
        }
      }
    })

    return () => {
      remove()
    }
  }, [t])

  return exitTimeInfo
}

export interface TimeoutExitEditModalType {
  show: () => void
}
interface TimeoutExitEditModalProps {
  timeInfo: ReturnType<typeof useTimeInfo>
}

export default forwardRef<TimeoutExitEditModalType, TimeoutExitEditModalProps>(({ timeInfo }, ref) => {
  const dialogRef = useRef<DialogType>(null)
  const inputRef = useRef<InputType>(null)
  const [visible, setVisible] = useState(false)
  const [timeText, setTimeText] = useState('')
  const exitTimeInfo = useTimeoutExitTimeInfo()
  const timeoutExitPlayed = useSettingValue('player.timeoutExitPlayed')
  const t = useI18n()

  const handleShow = () => {
    dialogRef.current?.setVisible(true)
    const currentVal = settingState.setting['player.timeoutExit'] || ''
    setTimeText(currentVal)
  }

  useImperativeHandle(ref, () => ({
    show() {
      if (visible) handleShow()
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow()
        })
      }
    },
  }))

  const handleCancelTimer = () => {
    if (timeInfo.isPlayedStop) {
      cancelTimeoutExit()
      dialogRef.current?.setVisible(false)
      return
    }
    stopTimeoutExit()
    toast(t('timeout_exit_tip_cancel'))
    dialogRef.current?.setVisible(false)
  }

  const handleApplyTime = (minNum: number) => {
    cancelTimeoutExit()
    startTimeoutExit(minNum * 60)
    toast(t('timeout_exit_tip_on', { time: formatTime(getTimeoutExitTime()) }))
    updateSetting({ 'player.timeoutExit': String(minNum) })
    dialogRef.current?.setVisible(false)
  }

  const handleConfirm = () => {
    let timeStr = timeText.trim()
    if (rxp.test(timeStr)) {
      timeStr = RegExp.$1
      if (parseInt(timeStr) > MAX_MIN) {
        toast(t('timeout_exit_tip_max', { num: MAX_MIN }))
        return
      }
    } else {
      if (timeStr.length) toast(t('input_error'))
      timeStr = ''
    }
    if (!timeStr) return
    const time = parseInt(timeStr)
    handleApplyTime(time)
  }

  const onPlayedStopToggle = (check: boolean) => {
    updateSetting({ 'player.timeoutExitPlayed': check })
  }

  return visible ? (
    <Dialog ref={dialogRef} title="睡眠定时关闭">
      <View style={styles.container}>
        {/* 当前状态卡片 */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>当前状态：</Text>
          <Text style={styles.statusVal}>
            {exitTimeInfo.time < 0
              ? '未开启定时'
              : `剩余 ${formatTime(exitTimeInfo.time)}`}
          </Text>
        </View>

        {/* 预设快捷胶囊 */}
        <Text style={styles.sectionTitle}>快速选择</Text>
        <View style={styles.presetRow}>
          {PRESET_MINUTES.map(min => (
            <TouchableOpacity
              key={min}
              style={[
                styles.presetPill,
                timeText === String(min) && styles.presetPillActive,
              ]}
              onPress={() => {
                setTimeText(String(min))
                handleApplyTime(min)
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.presetText,
                  timeText === String(min) && styles.presetTextActive,
                ]}
              >
                {min} 分钟
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 自定义分钟输入行 */}
        <Text style={styles.sectionTitle}>自定义时间</Text>
        <View style={styles.inputRow}>
          <Input
            ref={inputRef}
            placeholder="输入分钟数 (如 40)"
            value={timeText}
            onChangeText={setTimeText}
            keyboardType="number-pad"
            style={styles.input}
          />
          <TouchableOpacity
            style={styles.confirmSmallBtn}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmSmallText}>设置</Text>
          </TouchableOpacity>
        </View>

        {/* 播放完当前歌曲后退出 开关 */}
        <View style={styles.checkboxRow}>
          <CheckBox
            check={timeoutExitPlayed}
            label={t('timeout_exit_label_isPlayed')}
            onChange={onPlayedStopToggle}
          />
        </View>

        {/* 取消定时按钮 */}
        {exitTimeInfo.time >= 0 || timeInfo.isPlayedStop ? (
          <TouchableOpacity
            style={styles.cancelTimerBtn}
            onPress={handleCancelTimer}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelTimerText}>关闭定时</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Dialog>
  ) : null
})

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  statusLabel: {
    fontSize: 13,
    color: colors.inkSecondary,
    fontWeight: '500',
  },
  statusVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.brand,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.inkSecondary,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: '#F3F4F6',
  },
  presetPillActive: {
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    borderWidth: 1,
    borderColor: colors.brand,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  presetTextActive: {
    color: colors.brand,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: colors.ink,
  },
  confirmSmallBtn: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmSmallText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  checkboxRow: {
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  cancelTimerBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelTimerText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#DC2626',
  },
})
