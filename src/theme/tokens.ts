import { StyleSheet } from 'react-native'

/**
 * QQ 音乐式柔和现代设计令牌（单一来源）
 * 主视觉谱系：封面图像主导的柔和现代风
 * 深度模型：白表面 + 弥散软阴影 + hairline 分隔，不用硬描边
 */

export const colors = {
  // 品牌
  brand: '#F5A623', // 暖金（延续亮黄品牌记忆，收敛为质感金）
  brandDeep: '#E08C0F', // 金的按压/暂停态

  // 浅色世界（浏览场景）
  canvas: '#F5F6F8', // 页面底
  surface: '#FFFFFF', // 卡片/条面
  hairline: '#ECEEF1', // 分隔线
  ink: '#1A1C20', // 主文字
  inkSecondary: '#5A616B', // 次要文字
  inkTertiary: '#9AA1AB', // 弱文字

  // 深色世界（播放页）
  night: '#20222A', // 深空底
  nightSurface: '#2A2D35',
  onNight: 'rgba(255,255,255,0.92)',
  onNightSecondary: 'rgba(255,255,255,0.60)',
  onNightTertiary: 'rgba(255,255,255,0.40)',
  ghost: 'rgba(255,255,255,0.10)', // 幽灵按钮底
  nightHairline: 'rgba(255,255,255,0.08)',
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

/** 圆角 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
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
