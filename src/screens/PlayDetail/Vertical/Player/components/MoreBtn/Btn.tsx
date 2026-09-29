import { TouchableOpacity, StyleSheet, View } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useAppColors, useIsDarkTheme } from '@/theme/tokens'

export const BTN_WIDTH = scaleSizeW(36)
export const BTN_ICON_SIZE = 20

/**
 * 播放页更多操作钮（2026-09-29 设计稿：浅色白卡描边 / 深色幽灵样式）。
 */
export default ({ icon, color, onPress, onLongPress }: {
  icon: string
  color?: string
  onPress: () => void
  onLongPress?: () => void
}) => {
  const c = useAppColors()
  const isDark = useIsDarkTheme()

  return (
    <View style={styles.btnWrapper}>
      <TouchableOpacity
        style={[
          styles.controlBtn,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : c.hairline,
          },
        ]}
        activeOpacity={0.6}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <Icon name={icon} color={color ?? (isDark ? 'rgba(255,255,255,0.75)' : c.inkSecondary)} size={BTN_ICON_SIZE} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  btnWrapper: {
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtn: {
    width: BTN_WIDTH,
    height: BTN_WIDTH,
    borderRadius: BTN_WIDTH / 2,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
