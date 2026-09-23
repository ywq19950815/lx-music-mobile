import { forwardRef, useImperativeHandle, useState } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

export interface CurrentTagBtnProps {
  onShowList: () => void
}

export interface CurrentTagBtnType {
  setCurrentTagInfo: (name: string) => void
}

/**
 * NeoCurrentTagBtn: 波普胶囊标签选择按钮。
 * 电光粉底色 + 纯黑描边 + 粗体。
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
    paddingVertical: 4,
    borderRadius: neoBorders.radiusPill,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    backgroundColor: neoColors.cyan,
  },
  text: {
    fontWeight: '900',
    color: neoColors.black,
  },
})
