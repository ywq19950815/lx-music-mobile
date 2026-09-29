import { StyleSheet } from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '@/store/theme/state'

/**
 * QQ 音乐式柔和现代设计令牌（单一来源）
 * 主视觉谱系：封面图像主导的柔和现代风
 * 深度模型：白表面 + 弥散软阴影 + hairline 分隔，不用硬描边
 */

export const colors = {
  // 品牌（2026-09-29 设计稿定调：翡翠绿 Emerald #10B981）
  brand: '#10B981', // 翡翠绿 primary
  brandDeep: '#059669', // 绿的按压/暂停态
  brandLight: '#34D399', // 绿的亮部（渐变/光晕用）

  // 浅色世界（浏览场景，对齐设计稿 Slate 浅色系）
  canvas: '#F8FAFC', // 页面底
  surface: '#FFFFFF', // 卡片/条面
  hairline: '#E2E8F0', // 分隔线
  muted: '#F1F5F9', // 弱底（徽章/次级按钮底）
  ink: '#0F172A', // 主文字
  inkSecondary: '#64748B', // 次要文字
  inkTertiary: '#94A3B8', // 弱文字

  // 深色世界（播放页）
  night: '#20222A', // 深空底
  nightSurface: '#2A2D35',
  onNight: 'rgba(255,255,255,0.92)',
  onNightSecondary: 'rgba(255,255,255,0.60)',
  onNightTertiary: 'rgba(255,255,255,0.40)',
  ghost: 'rgba(255,255,255,0.10)', // 幽灵按钮底
  nightHairline: 'rgba(255,255,255,0.08)',
}

/**
 * 深色世界色板（奇哥 2026-09-28 补：原 colors 是静态浅色，深色下会导致"白底浅字"）。
 * 翻新页面时用 getColors(isDark) / useAppColors() 取，天然支持深色。
 */
export const darkColors = {
  canvas: '#0E0F12',
  surface: '#17191E',
  surface2: '#1F2228',
  hairline: 'rgba(255,255,255,0.08)',
  muted: '#1F2228',
  ink: 'rgba(255,255,255,0.92)',
  inkSecondary: 'rgba(255,255,255,0.60)',
  inkTertiary: 'rgba(255,255,255,0.38)',
  // 品牌系列在深色下保持一致
  brand: '#10B981',
  brandDeep: '#059669',
  brandLight: '#34D399',
  night: '#0E0F12',
  nightSurface: '#17191E',
  onNight: 'rgba(255,255,255,0.92)',
  onNightSecondary: 'rgba(255,255,255,0.60)',
  onNightTertiary: 'rgba(255,255,255,0.38)',
  ghost: 'rgba(255,255,255,0.10)',
  nightHairline: 'rgba(255,255,255,0.08)',
}

/** 主题感知取色：翻新页面用这个替代直接解构静态 colors */
export const getColors = (isDark: boolean) => (isDark ? darkColors : colors)

/** 在组件中直接取主题色（已接入全局 isDark） */
export const useAppColors = () => {
  const theme = useContext(ThemeContext)
  return getColors(theme.isDark)
}

/** 直接获取当前是否深色主题 */
export const useIsDarkTheme = () => {
  const theme = useContext(ThemeContext)
  return theme.isDark
}

/** 间距节奏（4 的倍数） */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
}

/** 圆角（设计稿克制圆角体系 4/8/12/16） */
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
}

/** 字阶（Android 上不依赖自定义字体，用字重 + 尺寸表达层级） */
export const typeScale = {
  display: 26,
  title: 20,
  headline: 17,
  body: 15,
  label: 13,
  caption: 11,
}

/** 动效令牌 */
export const motion = {
  spring: {
    friction: 7, // 略带回弹，不松垮
    tension: 60,
  },
  pressScale: 0.96, // 标准按压缩放
  durationFast: 150,
  durationBase: 240,
  durationSlow: 360,
  breathe: {
    to: 1.03, // 封面呼吸峰值
    duration: 2800, // 单程时长，缓慢不骚扰
  },
}

/**
 * 跨端弥散软阴影。
 * iOS: shadow* 属性；Android: elevation；Web: shadow* 由 react-native-web 映射。
 */
export const softShadow = (level: 'sm' | 'md' | 'lg' = 'md') => {
  const conf = {
    sm: { elevation: 2, y: 1, blur: 4, opacity: 0.5 },
    md: { elevation: 5, y: 3, blur: 10, opacity: 0.7 },
    lg: { elevation: 9, y: 6, blur: 18, opacity: 1.0 },
  }[level]
  return {
    shadowColor: '#171A1F',
    shadowOffset: { width: 0, height: conf.y },
    shadowOpacity: conf.opacity,
    shadowRadius: conf.blur,
    elevation: conf.elevation,
  }
}

export const hairlineStyle = StyleSheet.hairlineWidth
