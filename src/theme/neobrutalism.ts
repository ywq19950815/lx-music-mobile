import { StyleSheet, type ViewStyle, type TextStyle } from 'react-native'

/**
 * Neo-Brutalism / Playful Brutalism（新粗野主义 / 趣味波普风）设计系统
 * 严格遵循 neobrutalism.dev 视觉语言：
 * - 鲜明纯黑描边 (2.5px - 3px Black Borders)
 * - 纯黑硬边偏移阴影 (Zero-blur Hard Offset Shadows)
 * - 高饱和复古波普色彩碰撞 (High-saturation Pop Colors)
 * - 实体按压反馈与漫画风贴纸 (Tactile Press Feedback & Playful Badges)
 */

export const neoColors = {
  // 核心中性色
  black: '#000000',
  white: '#FFFFFF',
  offWhite: '#FFFDF5',      // 复古浅黄底纸
  cream: '#FFF8E7',         // 暖奶油色
  gray100: '#F4F4F0',
  gray200: '#E5E5DE',
  gray700: '#333333',
  gray800: '#1E1E1E',
  darkBg: '#121316',

  // 经典 Neo-Brutalism 高饱和波普色彩
  yellow: '#FFE600',        // 签名亮黄 (Primary)
  pink: '#FF66C4',          // 电光粉红 (Accent / Likes)
  cyan: '#00F0FF',          // 荧光青蓝 (Secondary / Play)
  purple: '#A388EE',        // 薰衣草紫 (Featured / Tags)
  green: '#23F07E',         // 漫画鲜绿 (Active / Success)
  orange: '#FF9F43',        // 复古亮橙 (Hot / Alerts)
  blue: '#3A86FF',          // 克莱因蓝
  coral: '#FF5C5C',         // 珊瑚红

  // 边框色
  border: '#000000',
}

export const neoBorders = {
  thin: 1.5,
  regular: 2.5,
  thick: 3.5,
  color: '#000000',
  radiusSm: 6,
  radiusMd: 12,
  radiusLg: 16,
  radiusPill: 999,
}

export const neoShadows = {
  // 跨端硬阴影定义：在 Web 渲染为 boxShadow，在原生配合 NeoCard 双层底座
  sm: {
    offset: 2.5,
    boxShadow: '2.5px 2.5px 0px #000000',
  },
  md: {
    offset: 4,
    boxShadow: '4px 4px 0px #000000',
  },
  lg: {
    offset: 6,
    boxShadow: '6px 6px 0px #000000',
  },
}

export const neoStyles = StyleSheet.create({
  // 基础黑边卡片
  card: {
    backgroundColor: neoColors.white,
    borderWidth: neoBorders.regular,
    borderColor: neoBorders.color,
    borderRadius: neoBorders.radiusMd,
  },
  // 亮黄重点卡片
  cardYellow: {
    backgroundColor: neoColors.yellow,
    borderWidth: neoBorders.regular,
    borderColor: neoBorders.color,
    borderRadius: neoBorders.radiusMd,
  },
  // 荧光青卡片
  cardCyan: {
    backgroundColor: neoColors.cyan,
    borderWidth: neoBorders.regular,
    borderColor: neoBorders.color,
    borderRadius: neoBorders.radiusMd,
  },
  // 电光粉卡片
  cardPink: {
    backgroundColor: neoColors.pink,
    borderWidth: neoBorders.regular,
    borderColor: neoBorders.color,
    borderRadius: neoBorders.radiusMd,
  },
  // 薰衣草紫卡片
  cardPurple: {
    backgroundColor: neoColors.purple,
    borderWidth: neoBorders.regular,
    borderColor: neoBorders.color,
    borderRadius: neoBorders.radiusMd,
  },

  // 漫画贴纸 / 胶囊标签
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: neoBorders.thin,
    borderColor: neoBorders.color,
    borderRadius: neoBorders.radiusPill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 粗体文字风格
  textTitle: {
    fontWeight: '900',
    color: neoColors.black,
    letterSpacing: -0.5,
  },
  textSubtitle: {
    fontWeight: '800',
    color: neoColors.black,
  },
  textBold: {
    fontWeight: '700',
    color: neoColors.black,
  },

  /**
   * 说明性文字（描述、统计数字、状态值等）。
   *
   * ⚠️ 必须显式指定 color，不要依赖 <Text> 的默认色。
   * 默认色取主题的 `c-font`：浅色主题下是深灰，但**深色主题下是浅灰
   * rgb(219,219,219)**。而 Neo-Brutalism 改造后的卡片底色统一是纯白，
   * 于是深色主题下这些文字会变成「浅灰 on 纯白」，对比度仅 1.38:1，基本看不清。
   */
  textDesc: {
    color: neoColors.gray700,
    fontWeight: '600',
  },
})
