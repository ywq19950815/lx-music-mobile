import { useMemo } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { colors, radius } from '@/theme/tokens'

interface Props {
  title: string
  children: React.ReactNode | React.ReactNode[]
}

export default ({ title, children }: Props) => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIndicator} />
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
    borderWidth: 1,
    borderColor: '#ECEEF2',
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerIndicator: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.brand,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
})
