import { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useI18n } from '@/lang'
import { setFontSize } from '@/core/common'
import { useFontSize } from '@/store/common/hook'
import Text from '@/components/common/Text'
import { getTextSize } from '@/utils/pixelRatio'
import { neoColors } from '@/theme/neobrutalism'

const LIST = [
  {
    size: 0.8,
    name: 'setting_basic_font_size_80',
  },
  {
    size: 0.9,
    name: 'setting_basic_font_size_90',
  },
  {
    size: 1,
    name: 'setting_basic_font_size_100',
  },
  {
    size: 1.1,
    name: 'setting_basic_font_size_110',
  },
  {
    size: 1.2,
    name: 'setting_basic_font_size_120',
  },
  {
    size: 1.3,
    name: 'setting_basic_font_size_130',
  },
] as const

type SIZE_TYPE = typeof LIST[number]['size']

const useActive = (size: SIZE_TYPE) => {
  const _size = useFontSize()
  const isActive = useMemo(() => _size == size, [_size, size])
  return isActive
}

const SizeText = () => {
  const size = getTextSize(14) * useFontSize()
  const t = useI18n()

  // 不用 theme['c-primary']：主题主色是浅绿 rgb(77,175,124)，落在纯白卡片上对比度仅 1.86:1，
  // 作为「字体大小预览」几乎看不清，反而失去了预览的意义。改用纯黑加粗。
  return <Text style={{ fontSize: size, color: neoColors.black, fontWeight: '800' }}>{t('setting_basic_font_size_preview')}</Text>
}

const Item = ({ size, label }: {
  size: SIZE_TYPE
  label: string
}) => {
  const isActive = useActive(size)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginRight={8} check={isActive} label={label} onChange={() => { setFontSize(size) }} need />
}

export default memo(() => {
  const t = useI18n()

  const list = useMemo(() => {
    return LIST.map((item) => ({ size: item.size, name: t(item.name) }))
  }, [t])

  return (
    <SubTitle title={t('setting_basic_font_size')}>
      <View style={styles.preview}>
        <SizeText />
      </View>
      <View style={styles.list}>
        {
          list.map(({ size, name }) => <Item key={size} size={size} label={name} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  preview: {
    justifyContent: 'center',
    // paddingTop: 3,
    paddingBottom: 10,
    height: 45,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
