import { memo, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import Text from './Text'
import { colors, radius } from '@/theme/tokens'

export type BadgeType = 'normal' | 'secondary' | 'tertiary'

export default memo(({ type = 'normal', children }: {
  type?: BadgeType
  children: string
}) => {
  const badgeStyle = useMemo(() => {
    switch (type) {
      case 'secondary':
        return {
          bgColor: '#F3F4F6',
          textColor: colors.inkSecondary,
        }
      case 'tertiary':
        return {
          bgColor: '#FEE2E2',
          textColor: '#DC2626',
        }
      case 'normal':
      default:
        return {
          bgColor: 'rgba(245, 166, 35, 0.12)',
          textColor: '#B36B00',
        }
    }
  }, [type])

  return (
    <View style={[styles.badgeContainer, { backgroundColor: badgeStyle.bgColor }]}>
      <Text style={[styles.text, { color: badgeStyle.textColor }]} size={9.5}>{children}</Text>
    </View>
  )
})

const styles = StyleSheet.create({
  badgeContainer: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginRight: 6,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
})

