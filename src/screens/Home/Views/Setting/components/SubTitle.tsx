import { memo } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

export default memo(({ title, children }: {
  title: string
  children: React.ReactNode | React.ReactNode[]
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleBadge}>
        <Text style={styles.titleText}>{title}</Text>
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    marginTop: 12,
    marginBottom: 8,
    paddingTop: 6,
  },
  titleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8E7',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  content: {
    paddingLeft: 4,
  },
})

