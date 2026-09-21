import { memo, useMemo } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'

const styles = createStyle({
  badgeContainer: {
    paddingHorizontal: 4,
    paddingVertical: 0.5,
    borderRadius: 3,
    borderWidth: 0.5,
    marginRight: 6,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '500',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
})

export type BadgeType = 'normal' | 'secondary' | 'tertiary'

export default memo(({ type = 'normal', children }: {
  type?: BadgeType
  children: string
}) => {
  const theme = useTheme()
  const colors = useMemo(() => {
    const colors = { textColor: '', borderColor: '', bgColor: 'rgba(0, 0, 0, 0.03)' }
    switch (type) {
      case 'normal':
        colors.textColor = theme['c-badge-primary']
        colors.borderColor = theme['c-badge-primary']
        break
      case 'secondary':
        colors.textColor = theme['c-badge-secondary']
        colors.borderColor = theme['c-badge-secondary']
        break
      case 'tertiary':
        colors.textColor = theme['c-badge-tertiary']
        colors.borderColor = theme['c-badge-tertiary']
        break
    }
    return colors
  }, [type, theme])

  return (
    <View style={[styles.badgeContainer, { borderColor: colors.borderColor, backgroundColor: colors.bgColor }]}>
      <Text style={styles.text} size={9} color={colors.textColor}>{children}</Text>
    </View>
  )
})

