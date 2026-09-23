import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import CheckBox from './Checkbox'

import { createStyle, tipDialog } from '@/utils/tools'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import Text from '../Text'
import { Icon } from '../Icon'

export interface CheckBoxProps {
  check: boolean
  label?: string
  children?: React.ReactNode
  onChange: (check: boolean) => void
  disabled?: boolean
  need?: boolean
  size?: number
  marginRight?: number
  marginBottom?: number

  helpTitle?: string
  helpDesc?: string
}

export default ({ check, label, children, onChange, helpTitle, helpDesc, disabled = false, need = false, marginRight = 0, marginBottom = 0, size = 1 }: CheckBoxProps) => {
  const theme = useTheme()
  const [isDisabled, setDisabled] = useState(false)

  useEffect(() => {
    if (need) {
      if (check) {
        if (!isDisabled) setDisabled(true)
      } else {
        if (isDisabled) setDisabled(false)
      }
    } else {
      isDisabled && setDisabled(false)
    }
  }, [check, need, isDisabled])

  const handleLabelPress = useCallback(() => {
    if (isDisabled || disabled) return
    onChange?.(!check)
  }, [isDisabled, disabled, onChange, check])

  const helpComponent = useMemo(() => {
    const handleShowHelp = () => {
      const modalTitle = helpTitle || (typeof label === 'string' ? label : '') || '提示说明'
      void tipDialog({
        title: modalTitle,
        message: helpDesc,
        btnText: global.i18n.t('understand'),
      })
    }
    return (helpTitle ?? helpDesc) ? (
      <TouchableOpacity
        style={styles.helpBtn}
        onPress={handleShowHelp}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.helpBtnText}>?</Text>
      </TouchableOpacity>
    ) : null
  }, [helpTitle, helpDesc, label])

  const contentStyle = { ...styles.content, marginBottom: scaleSizeH(marginBottom) }
  const labelStyle = { ...styles.label, marginRight: scaleSizeW(marginRight) }

  return (
    <View style={contentStyle}>
      {/* 注意：need（单选组「必须选中一项」）造成的 isDisabled 只用于拦截点击，
          不传给 Checkbox 的 disabled —— 否则选中项会被渲染成灰色无边框阴影的禁用态，
          与普通勾选框（黄底黑边硬阴影）风格割裂。选中态统一走 checked 样式。 */}
      <CheckBox
        status={check ? 'checked' : 'unchecked'}
        disabled={disabled}
        onPress={handleLabelPress}
        size={size}
      />
      <TouchableOpacity
        style={labelStyle}
        activeOpacity={0.7}
        onPress={handleLabelPress}
        disabled={disabled || isDisabled}
      >
        {label ? (
          <Text
            style={[
              styles.name,
              { color: disabled ? '#8E8E93' : '#000000', fontWeight: '700' },
            ]}
            size={14.5 * size}
          >
            {label}
          </Text>
        ) : children}
      </TouchableOpacity>
      {helpComponent}
    </View>
  )
}

const styles = createStyle({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    marginRight: 10,
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 5,
  },
  label: {
    flexGrow: 0,
    flexShrink: 1,
    paddingRight: 4,
  },
  name: {
    marginTop: 0,
  },
  helpBtn: {
    backgroundColor: '#FFE600',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 6,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  helpBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 12,
  },
})


