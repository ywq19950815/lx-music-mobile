import { memo, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import Text from './Text'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

export type BadgeType = 'normal' | 'secondary' | 'tertiary'

export default memo(({ type = 'normal', children }: {
  type?: BadgeType
  children: string
}) => {
  const badgeStyle = useMemo(() => {
    switch (type) {
      case 'secondary':
        return {
          bgColor: neoColors.cyan,
          textColor: neoColors.black,
        }
      case 'tertiary':
        return {
          bgColor: neoColors.pink,
          textColor: neoColors.black,
        }
      case 'normal':
      default:
        return {
          bgColor: neoColors.yellow,
          textColor: neoColors.black,
        }
    }
  }, [type])

  return (
    <View style={[styles.badgeContainer, { backgroundColor: badgeStyle.bgColor }]}>
      <Text style={[styles.text, { color: badgeStyle.textColor }]} size={9}>{children}</Text>
    </View>
  )
})

const styles = StyleSheet.create({
  badgeContainer: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: neoBorders.radiusPill,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    marginRight: 6,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    ...neoShadows.sm,
  },
  text: {
    fontWeight: '900',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
})

