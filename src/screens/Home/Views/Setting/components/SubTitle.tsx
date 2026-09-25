import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { colors } from '@/theme/tokens'

export default memo(({ title, children }: {
  title: string
  children: React.ReactNode | React.ReactNode[]
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>{title}</Text>
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 8,
    paddingTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSecondary,
    letterSpacing: -0.2,
  },
  content: {
    paddingLeft: 2,
  },
})
