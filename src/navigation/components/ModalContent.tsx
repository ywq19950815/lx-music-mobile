import { View, StyleSheet } from 'react-native'
import { colors, radius } from '@/theme/tokens'

const HEADER_HEIGHT = 38

interface Props {
  children: React.ReactNode
}

/**
 * RNN 全屏 Overlay 弹窗的现代容器
 * 供 PactModal、VersionModal、SyncModeModal 等全屏浮层使用
 */
export default ({ children }: Props) => {
  return (
    <View style={styles.centeredView}>
      <View style={styles.modalView}>
        <View style={styles.header}>
          <View style={styles.brandBar} />
        </View>
        <View style={styles.body}>
          {children}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 20,
  },
  modalView: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '82%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    height: HEADER_HEIGHT,
  },
  brandBar: {
    width: 3.5,
    height: 12,
    borderRadius: 2,
    backgroundColor: colors.brand,
  },
  body: {
    backgroundColor: colors.surface,
  },
})
