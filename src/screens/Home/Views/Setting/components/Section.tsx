import { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { colors } from '@/theme/tokens'

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

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F2F4F7',
  },
  headerIconChip: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
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
