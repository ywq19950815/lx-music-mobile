import { memo, useMemo } from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'

import { updateSetting } from '@/core/common'
import { setDesktopLyricColor } from '@/core/desktopLyric'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { colors, radius } from '@/theme/tokens'

const themes = [
  // 第一个色卡与 config/defaultSetting.ts 的默认值 rgba(7,197,86,1) 保持一致，
  // 否则首次进入时九个色卡没有一个处于选中态
  ['#07c556', 'rgba(0,0,0,0.6)'],
  ['#fffa12', 'rgba(0,0,0,0.6)'],
  ['#019ce4', 'rgba(0,0,0,0.6)'],
  ['#ff1222', 'rgba(0,0,0,0.6)'],
  ['#ef6976', 'rgba(0,0,0,0.6)'],
  ['#c851d4', 'rgba(0,0,0,0.6)'],
  ['#ffa600', 'rgba(0,0,0,0.6)'],
  ['#000000', '#ffffff'],
  ['#ffffff', 'rgba(0,0,0,0.6)'],
] as const
type Theme = typeof themes[number]

/** 把 #hex / rgba() 统一解析成 [r,g,b]，避免「同一颜色、不同写法」比对失败 */
const toRgb = (c: string): [number, number, number] | null => {
  if (c.startsWith('#')) {
    const h = c.slice(1)
    const f = h.length === 3 ? h.split('').map(x => x + x).join('') : h
    if (f.length < 6) return null
    return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)]
  }
  const m = c.match(/rgba?\(([^)]+)\)/)
  if (m) return m[1].split(',').slice(0, 3).map(s => parseInt(s.trim(), 10)) as [number, number, number]
  return null
}

/**
 * ThemeSwatch：主题色卡
 * - 32×32 圆形色块 + 柔和投影，落在白卡片上干净清爽
 * - 选中态：品牌色描边 + 轻微放大，一眼能看出当前用的是哪个
 */
const ThemeSwatch = ({ color, active, change }: {
  color: Theme
  active: boolean
  change: (color: Theme) => void
}) => {
  // 深色卡用白勾，浅色卡用深勾，保证任何底色上都可见
  const checkColor = color[0] === '#000000' || color[0] === '#019ce4' || color[0] === '#ff1222' || color[0] === '#c851d4' ? '#FFFFFF' : '#0F172A'
  return (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.7}
      onPress={() => { change(color) }}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
    >
      <View style={[styles.swatch, { backgroundColor: color[0] }, active ? styles.swatchActive : null]}>
        {active ? <View style={[styles.checkMark, { borderColor: checkColor }]} /> : null}
      </View>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const playedColor = useSettingValue('desktopLyric.style.lyricPlayedColor')

  const activeIndex = useMemo(() => {
    const cur = toRgb(playedColor)
    if (!cur) return -1
    return themes.findIndex(c => {
      const t = toRgb(c[0])
      return !!t && t[0] === cur[0] && t[1] === cur[1] && t[2] === cur[2]
    })
  }, [playedColor])

  const setThemeDesktopLyric = (color: Theme) => {
    void setDesktopLyricColor(null, color[0], color[1]).then(() => {
      updateSetting({ 'desktopLyric.style.lyricPlayedColor': color[0], 'desktopLyric.style.lyricShadowColor': color[1] })
    })
  }

  return (
    <View style={styles.list}>
      {
        themes.map((c, i) => (
          <ThemeSwatch key={c[0] + i.toString()} color={c} active={i === activeIndex} change={setThemeDesktopLyric} />
        ))
      }
    </View>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  swatchActive: {
    borderWidth: 2.5,
    borderColor: colors.brand,
    transform: [{ scale: 1.08 }],
  },
  checkMark: {
    width: 11,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    borderStyle: 'solid',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
})
