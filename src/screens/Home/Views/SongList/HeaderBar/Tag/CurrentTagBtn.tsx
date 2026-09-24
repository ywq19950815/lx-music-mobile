import { forwardRef, useImperativeHandle, useState } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { colors } from '@/theme/tokens'

export interface CurrentTagBtnProps {
  onShowList: () => void
}

export interface CurrentTagBtnType {
  setCurrentTagInfo: (name: string) => void
}

/**
 * 歌单标签选择按钮：精致胶囊按钮。
 */
export default forwardRef<CurrentTagBtnType, CurrentTagBtnProps>(({ onShowList }, ref) => {
  const t = useI18n()
  const [name, setName] = useState('')

  useImperativeHandle(ref, () => ({
    setCurrentTagInfo(name) {
      if (!name) name = t('songlist_tag_default')
      setName(name)
    },
  }))

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.pill}
        onPress={onShowList}
        activeOpacity={0.7}
      >
        <Text style={styles.text} size={11}>
          {name || t('songlist_tag_default')} ▾
        </Text>
      </TouchableOpacity>
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  text: {
    fontWeight: '600',
    color: colors.ink,
  },
})
