import { memo, useCallback, useState } from 'react'
import { View, StyleSheet, Switch, TouchableOpacity } from 'react-native'

import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { colors } from '@/theme/tokens'
import Slider, { type SliderProps } from '../../components/Slider'

/* ------------------------------------------------------------------ */
/* SwitchRow：iOS 式开关行（替代旧 CheckBoxItem）                        */
/* ------------------------------------------------------------------ */
export const SwitchRow = memo(({ label, value, onChange, last }: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  last?: boolean
}) => {
  return (
    <View style={[styles.switchRow, last ? null : styles.rowDivider]}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E2E8F0', true: colors.brand }}
        thumbColor="#FFFFFF"
        style={styles.switch}
      />
    </View>
  )
})

/* ------------------------------------------------------------------ */
/* SliderRow：标题 + 数值气泡 + 滑块                                    */
/* ------------------------------------------------------------------ */
export const SliderRow = memo(({ title, value, minimumValue, maximumValue, step, onCommit }: {
  title: string
  value: number
  minimumValue: number
  maximumValue: number
  step: number
  onCommit: (v: number) => void
}) => {
  const [sliding, setSliding] = useState(value)
  const [isSliding, setSlidingState] = useState(false)

  const handleSlidingStart = useCallback<NonNullable<SliderProps['onSlidingStart']>>(() => {
    setSlidingState(true)
  }, [])
  const handleValueChange = useCallback<NonNullable<SliderProps['onValueChange']>>(v => {
    setSliding(v)
  }, [])
  const handleComplete = useCallback<NonNullable<SliderProps['onSlidingComplete']>>(v => {
    setSlidingState(false)
    if (value == v) return
    onCommit(v)
  }, [value, onCommit])

  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHead}>
        <Text style={styles.sliderTitle}>{title}</Text>
        <View style={styles.valueBubble}>
          <Text style={styles.valueText}>{isSliding ? sliding : value}</Text>
        </View>
      </View>
      <Slider
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        onSlidingStart={handleSlidingStart}
        onValueChange={handleValueChange}
        onSlidingComplete={handleComplete}
      />
    </View>
  )
})

/* ------------------------------------------------------------------ */
/* SegmentRow：标题 + 分段选择（替代旧 CheckBox 列表）                   */
/* ------------------------------------------------------------------ */
export function SegmentRow<T extends string>({ title, list, value, onChange }: {
  title: string
  list: { id: T, label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <View style={styles.segmentRow}>
      <Text style={styles.sliderTitle}>{title}</Text>
      <View style={styles.segmentTrack}>
        {
          list.map(({ id, label }) => {
            const isActive = value == id
            return (
              <TouchableOpacity
                key={id}
                style={[styles.segmentItem, isActive ? styles.segmentItemActive : null]}
                activeOpacity={0.8}
                onPress={() => { if (!isActive) onChange(id) }}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.segmentText, isActive ? styles.segmentTextActive : null]}>{label}</Text>
              </TouchableOpacity>
            )
          })
        }
      </View>
    </View>
  )
}

/* ------------------------------------------------------------------ */
/* GroupTitle：小节标题（复用 SubTitle 的视觉语言，内置间距）             */
/* ------------------------------------------------------------------ */
export const GroupTitle = memo(({ title }: { title: string }) => {
  return (
    <View style={styles.groupTitle}>
      <Text style={styles.groupTitleText}>{title}</Text>
    </View>
  )
})

const styles = createStyle({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingLeft: 2,
    paddingRight: 2,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEF1F5',
  },
  switchLabel: {
    fontSize: 14,
    color: colors.ink,
    flexShrink: 1,
  },
  switch: {
    transform: [{ scale: 0.85 }],
    marginLeft: 8,
  },
  sliderRow: {
    marginTop: 10,
    marginBottom: 4,
  },
  sliderHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -2,
    paddingLeft: 2,
  },
  sliderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSecondary,
    letterSpacing: -0.2,
  },
  valueBubble: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 44,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandDeep,
    fontVariant: ['tabular-nums'],
  },
  segmentRow: {
    marginTop: 12,
    marginBottom: 6,
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: '#F1F4F8',
    borderRadius: 12,
    padding: 3,
    marginTop: 8,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    color: colors.inkSecondary,
  },
  segmentTextActive: {
    color: colors.brandDeep,
    fontWeight: '700',
  },
  groupTitle: {
    marginTop: 14,
    marginBottom: 2,
    paddingLeft: 2,
  },
  groupTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSecondary,
    letterSpacing: -0.2,
  },
})
