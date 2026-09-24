import { StyleSheet, type ViewStyle, type TextStyle } from 'react-native'

/**
 * 兼容层：导出名保持 neobrutalism 时代的 API 不变，值已全部翻转
 * 为「QQ 音乐式柔和现代」令牌（详见 tokens.ts）。
 * 80 个使用 neo* 的文件无需改动即可获得新视觉。
 */

export const neoColors = {
  // 核心中性色
  black: '#1A1C20',      // 墨色（主文字；作边框/阴影的场景已逐步迁移到 neoBorders.color）
  white: '#FFFFFF',
  offWhite: '#FFFFFF',   // 原米白纸 → 纯白表面
  cream: '#F7F8FA',      // 暖奶油 → 中性浅面
  gray100: '#F3F4F6',
  gray200: '#E9EAEE',
  gray700: '#5A616B',
  gray800: '#1A1C20',
  darkBg: '#20222A',

  // 波普高饱和色 → 柔和现代同职能色
  yellow: '#F5A623',     // 品牌金（Primary）
  pink: '#FA5151',       // 点赞/激活 → QQ 红
  cyan: '#4A90D9',       // 次强调 → 雾蓝
  purple: '#8E7CC3',     // 标签 → 灰紫
  green: '#4DAF7C',      // 成功 → 柔绿
  orange: '#FF9F43',     // 热/提醒
  blue: '#4A90D9',
  coral: '#FA5151',

  // 分隔线
  border: '#E9EAEE',
}

export const neoBorders = {
  thin: 1,
  regular: 1,
  thick: 1.5,
  color: '#E9EAEE',
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusPill: 999,
}

export const neoShadows = {
  // 弥散软阴影：Web 渲染为 boxShadow，原生用 shadow*/elevation（见 softShadow）
  sm: {
    offset: 2,
    boxShadow: '0px 1px 4px rgba(23,26,31,0.06)',
    shadowColor: '#171A1F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    offset: 3,
    boxShadow: '0px 3px 10px rgba(23,26,31,0.07)',
    shadowColor: '#171A1F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 5,
  },
  lg: {
    offset: 6,
    boxShadow: '0px 6px 18px rgba(23,26,31,0.10)',
    shadowColor: '#171A1F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 9,
  },
}

export const neoStyles = StyleSheet.create({
  // 白面卡片：无边框，柔和投影
  card: {
    backgroundColor: neoColors.white,
    borderRadius: neoBorders.radiusMd,
  },
  cardYellow: {
    backgroundColor: neoColors.yellow,
    borderRadius: neoBorders.radiusMd,
  },
  cardCyan: {
    backgroundColor: neoColors.cyan,
    borderRadius: neoBorders.radiusMd,
  },
  cardPink: {
    backgroundColor: neoColors.pink,
    borderRadius: neoBorders.radiusMd,
  },
  cardPurple: {
    backgroundColor: neoColors.purple,
    borderRadius: neoBorders.radiusMd,
  },

  // 胶囊标签：无边框柔和底
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: neoColors.gray100,
    borderRadius: neoBorders.radiusPill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 文字层级：用字重与色阶表达，不叠装饰
  textTitle: {
    fontWeight: '700',
    color: neoColors.black,
    letterSpacing: 0,
  },
  textSubtitle: {
    fontWeight: '600',
    color: neoColors.black,
  },
  textBold: {
    fontWeight: '600',
    color: neoColors.black,
  },

  /**
   * 说明性文字（描述、统计数字、状态值等）。
   *
   * ⚠️ 必须显式指定 color，不要依赖 <Text> 的默认色：
   * 深色主题下默认色是浅灰 rgb(219,219,219)，而卡片底色统一纯白，
   * 对比度仅 1.38:1，基本看不清。
   */
  textDesc: {
    color: neoColors.gray700,
    fontWeight: '400',
  },
})
