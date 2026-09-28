import { useMemo } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { colors, radius } from '@/theme/tokens'

interface Props {
  title: string
  icon?: string
  children: React.ReactNode | React.ReactNode[]
}

export default ({ title, icon, children }: Props) => {
  const iconNode = useMemo(() => {
    if (!icon) return null
    return (
      <View style={styles.headerIconChip}>
        <Icon name={icon} size={15} color={colors.brand} />
      </View>
    )
  }, [icon])

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        {iconNode}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <View style={styles.cardBody}>
        {children}
      </View>
    </View>
  )
}

const styles = createStyle({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  headerIconChip: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(49, 196, 125, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
})
