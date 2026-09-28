import { memo, useRef, useCallback } from 'react'
import { View, Switch, TouchableOpacity, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { colors } from '@/theme/tokens'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'

export interface SwitchRowProps {
  title: string
  desc?: string
  value: boolean
  onValueChange: (val: boolean) => void
  disabled?: boolean
  helpTitle?: string
  helpDesc?: string
  isLast?: boolean
}

export const SettingSwitchRow = memo(({
  title,
  desc,
  value,
  onValueChange,
  disabled = false,
  helpTitle,
  helpDesc,
  isLast = false,
}: SwitchRowProps) => {
  const alertRef = useRef<ConfirmAlertType>(null)

  const handleShowHelp = useCallback(() => {
    alertRef.current?.setVisible(true)
  }, [])

  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.leftCol}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>{title}</Text>
          {(helpTitle || helpDesc) ? (
            <TouchableOpacity
              style={styles.helpBtn}
              onPress={handleShowHelp}
              activeOpacity={0.6}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.helpBtnText}>?</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {desc ? <Text style={styles.descText}>{desc}</Text> : null}
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#E2E8F0', true: colors.brand }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E2E8F0"
        style={styles.switch}
      />

      {(helpTitle || helpDesc) ? (
        <ConfirmAlert
          ref={alertRef}
          cancelText=""
          confirmText="我知道了"
          closeBtn={false}
          title={helpTitle || title}
        >
          <View style={styles.helpDialogBody}>
            <Text style={styles.helpDialogText}>{helpDesc}</Text>
          </View>
        </ConfirmAlert>
      ) : null}
    </View>
  )
})

export interface PillOption<T> {
  label: string
  value: T
  badge?: string
}

export interface PillSelectRowProps<T> {
  title: string
  desc?: string
  options: PillOption<T>[]
  currentValue: T
  onSelect: (val: T) => void
  isLast?: boolean
}

export function SettingPillSelectRow<T extends string | number>({
  title,
  desc,
  options,
  currentValue,
  onSelect,
  isLast = false,
}: PillSelectRowProps<T>) {
  return (
    <View style={[styles.pillSection, !isLast && styles.rowBorder]}>
      <View style={styles.pillHeader}>
        <Text style={styles.titleText}>{title}</Text>
        {desc ? <Text style={styles.descText}>{desc}</Text> : null}
      </View>

      <View style={styles.pillGroup}>
        {options.map((opt) => {
          const active = opt.value === currentValue
          return (
            <TouchableOpacity
              key={String(opt.value)}
              style={[styles.pillBtn, active && styles.pillBtnActive]}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {opt.label}
              </Text>
              {opt.badge ? (
                <View style={[styles.badge, active && styles.badgeActive]}>
                  <Text style={[styles.badgeText, active && styles.badgeTextActive]}>
                    {opt.badge}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  leftCol: {
    flex: 1,
    paddingRight: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  descText: {
    fontSize: 12,
    color: colors.inkSecondary,
    marginTop: 2.5,
    lineHeight: 16.5,
  },
  helpBtn: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  helpBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.inkSecondary,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  helpDialogBody: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  helpDialogText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.inkSecondary,
  },
  pillSection: {
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  pillHeader: {
    marginBottom: 10,
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 6.5,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillBtnActive: {
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
    borderColor: colors.brand,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.ink,
  },
  pillTextActive: {
    color: colors.brand,
    fontWeight: '700',
  },
  badge: {
    marginLeft: 4,
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  badgeActive: {
    backgroundColor: colors.brand,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
})
