import { type ReactNode } from 'react'
import { TouchableOpacity, View, Switch, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Slider, { type SliderProps } from '@/components/common/Slider'
import { useAppColors, useIsDarkTheme, colors, radius } from '@/theme/tokens'

/**
 * 播放器设置抽屉的统一视觉原子（主题感知，深浅双适配）。
 * 风格对齐 QQ 音乐式柔和现代：白/深色表面 + 卡片分组 + 软分隔 + 品牌绿强调。
 */

/** 分组卡片：浅色用极浅灰底，深色用微亮表面，天然分层 */
export const SheetCard = ({ title, children }: { title: string, children: ReactNode }) => {
  const c = useAppColors()
  const isDark = useIsDarkTheme()
  return (
    <View style={{
      marginHorizontal: 16,
      marginTop: 14,
      backgroundColor: isDark ? '#1F2228' : '#F7F9FC',
      borderRadius: radius.lg,
      paddingHorizontal: 14,
      paddingTop: title ? 6 : 4,
      paddingBottom: 6,
    }}>
      {title ? (
        <Text style={{
          fontSize: 11.5,
          fontWeight: '700',
          color: c.inkTertiary,
          letterSpacing: 0.6,
          paddingTop: 10,
          paddingBottom: 4,
        }}>{title}</Text>
      ) : null}
      {children}
    </View>
  )
}

/** 开关行：左标题（可带描述），右现代 Switch */
export const SheetSwitchRow = ({
  title,
  desc,
  value,
  onValueChange,
  isLast = false,
}: {
  title: string
  desc?: string
  value: boolean
  onValueChange: (val: boolean) => void
  isLast?: boolean
}) => {
  const c = useAppColors()
  const isDark = useIsDarkTheme()
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 13,
      paddingHorizontal: 2,
      borderBottomWidth: isLast ? 0 : 0.5,
      borderBottomColor: c.hairline,
    }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ fontSize: 14.5, fontWeight: '600', color: c.ink }}>{title}</Text>
        {desc ? <Text style={{ fontSize: 12, color: c.inkSecondary, marginTop: 2.5, lineHeight: 16.5 }}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: isDark ? 'rgba(255,255,255,0.16)' : '#E2E8F0', true: colors.brand }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={isDark ? 'rgba(255,255,255,0.16)' : '#E2E8F0'}
        style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
      />
    </View>
  )
}

/** 分段控件（滑块式）：左标题，下方胶囊分段 */
export const SheetSegmentRow = <T extends string | number>({
  title,
  options,
  currentValue,
  onSelect,
}: {
  title: string
  options: { label: string, value: T }[]
  currentValue: T
  onSelect: (val: T) => void
}) => {
  const c = useAppColors()
  const isDark = useIsDarkTheme()
  return (
    <View style={{ paddingVertical: 13, paddingHorizontal: 2 }}>
      <Text style={{ fontSize: 14.5, fontWeight: '600', color: c.ink, marginBottom: 11 }}>{title}</Text>
      <View style={{
        flexDirection: 'row',
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EAEEF3',
        borderRadius: radius.md,
        padding: 3,
      }}>
        {options.map((opt) => {
          const active = opt.value === currentValue
          return (
            <TouchableOpacity
              key={String(opt.value)}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: radius.sm,
                backgroundColor: active ? c.surface : 'transparent',
                shadowColor: '#171A1F',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: active ? (isDark ? 0.4 : 0.18) : 0,
                shadowRadius: 3,
                elevation: active ? 2 : 0,
              }}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={{
                textAlign: 'center',
                fontSize: 13,
                fontWeight: active ? '700' : '500',
                color: active ? colors.brand : c.inkSecondary,
              }}>{opt.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

/** 滑块行：标题 + 品牌绿数值，下方全宽滑块 */
export const SheetSliderRow = ({
  title,
  valueText,
  minimumValue,
  maximumValue,
  step,
  value,
  onSlidingStart,
  onValueChange,
  onSlidingComplete,
}: {
  title: string
  valueText: string
  minimumValue: number
  maximumValue: number
  step: number
  value: number
  onSlidingStart?: SliderProps['onSlidingStart']
  onValueChange?: SliderProps['onValueChange']
  onSlidingComplete?: SliderProps['onSlidingComplete']
}) => {
  const c = useAppColors()
  return (
    <View style={{ paddingVertical: 13, paddingHorizontal: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <Text style={{ fontSize: 14.5, fontWeight: '600', color: c.ink }}>{title}</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.brand }}>{valueText}</Text>
      </View>
      <Slider
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        onSlidingStart={onSlidingStart}
        onValueChange={onValueChange}
        onSlidingComplete={onSlidingComplete}
      />
    </View>
  )
}

/** 文字操作行（如重置），右对齐品牌绿 */
export const SheetTextButton = ({ label, onPress }: { label: string, onPress: () => void }) => {
  const c = useAppColors()
  return (
    <View style={{ paddingVertical: 8, paddingHorizontal: 2, alignItems: 'flex-end' }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.brand }}>{label}</Text>
      </TouchableOpacity>
    </View>
  )
}

/** 抽屉顶部圆形关闭钮：对标 QQ 音乐现代设计，典雅微圆盘 + 细致微边框 + 高雅微图标 */
export const SheetCloseButton = ({ onPress, color }: { onPress: () => void, color?: string }) => {
  const isDark = useIsDarkTheme()
  const c = useAppColors()
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: color || (isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9'),
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Icon
        name="close"
        size={12}
        color={isDark ? 'rgba(255,255,255,0.75)' : c.inkSecondary}
      />
    </TouchableOpacity>
  )
}
