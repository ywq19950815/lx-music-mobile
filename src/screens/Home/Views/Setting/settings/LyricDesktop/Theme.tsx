import { updateSetting } from '@/core/common'
import { setDesktopLyricColor } from '@/core/desktopLyric'
import { useI18n } from '@/lang'
import { memo, useMemo } from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'

import SubTitle from '../../components/SubTitle'
import { useSettingValue } from '@/store/setting/hook'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

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
 * NeoThemeSwatch: 波普色卡
 * - 30×30 方块 + 2px 纯黑描边 + 硬偏移阴影（与全局实体按键/徽章同一套语言）
 * - 选中态：物理下沉（阴影收起）+ 对比色加粗对勾，一眼能看出当前用的是哪个
 *   对勾颜色取该主题的阴影色（即歌词投影色），天然与色块形成对比：
 *   纯黑块 → 白勾，其余 → 黑勾。
 */
const ThemeItem = ({ color, active, change }: {
  color: Theme
  active: boolean
  change: (color: Theme) => void
}) => {
  // 纯黑主题用白色对勾，其余用黑色，保证任何色块上勾都清晰
  const checkColor = color[0] === '#000000' ? neoColors.white : neoColors.black

  return (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.7}
      onPress={() => { change(color) }}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
    >
      <View style={[styles.swatch, { backgroundColor: color[0] }, active ? styles.swatchActive : null]}>
        {/* 对勾用纯 View 画（图标字体里没有 check-bold 字形），颜色跟随该主题的对比色 */}
        {active ? <View style={[styles.checkMark, { width: 12, height: 7, borderColor: checkColor }]} /> : null}
      </View>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const t = useI18n()
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
    <SubTitle title={t('setting_lyric_desktop_theme')}>
      <View style={styles.list}>
        {
          themes.map((c, i) => (
            <ThemeItem key={c[0] + i.toString()} color={c} active={i === activeIndex} change={setThemeDesktopLyric} />
          ))
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 4,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: neoBorders.regular,
    borderColor: neoColors.black,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: neoColors.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  // 选中：物理按下去，阴影收起，与全局实体按键的按压语言一致
  swatchActive: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOpacity: 0,
    elevation: 0,
  },
  // 纯 View 对勾：左下边框 + -45° 旋转 = ✓
  checkMark: {
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderStyle: 'solid',
    transform: [{ rotate: '-45deg' }],
    marginTop: -3,
  },
})
