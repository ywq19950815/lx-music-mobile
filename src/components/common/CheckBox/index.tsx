import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import CheckBox from './Checkbox'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'

import { createStyle } from '@/utils/tools'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import Text from '../Text'
import { colors } from '@/theme/tokens'

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

export default ({
  check,
  label,
  children,
  onChange,
  helpTitle,
  helpDesc,
  disabled = false,
  need = false,
  marginRight = 0,
  marginBottom = 0,
  size = 1,
}: CheckBoxProps) => {
  const theme = useTheme()
  const [isDisabled, setDisabled] = useState(false)
  const alertRef = useRef<ConfirmAlertType>(null)

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

  const handleShowHelp = useCallback(() => {
    alertRef.current?.setVisible(true)
  }, [])

  const modalTitle = helpTitle || (typeof label === 'string' ? label : '') || '提示说明'

  // 精致低干扰的帮助圆点按钮，避免硬核黑色大问号突兀干扰视觉
  const helpComponent = useMemo(() => {
    return (helpTitle ?? helpDesc) ? (
      <TouchableOpacity
        style={styles.helpBtn}
        onPress={handleShowHelp}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.helpBtnText}>?</Text>
      </TouchableOpacity>
    ) : null
  }, [helpTitle, helpDesc, handleShowHelp])

  const contentStyle = { ...styles.content, marginBottom: scaleSizeH(marginBottom) }
  const labelStyle = { ...styles.label, marginRight: scaleSizeW(marginRight) }

  return (
    <View style={contentStyle}>
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
              { color: disabled ? colors.inkTertiary : colors.ink },
            ]}
            size={14 * size}
          >
            {label}
          </Text>
        ) : children}
      </TouchableOpacity>
      {helpComponent}
      {(helpTitle ?? helpDesc) ? (
        <ConfirmAlert
          ref={alertRef}
          title={modalTitle}
          text={helpDesc}
          showCancel={false}
          confirmText={global.i18n?.t('understand') || '我知道了'}
          onConfirm={() => alertRef.current?.setVisible(false)}
        />
      ) : null}
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
    paddingVertical: 6,
  },
  label: {
    flexGrow: 0,
    flexShrink: 1,
    paddingRight: 4,
  },
  name: {
    marginTop: 0,
    fontWeight: '500',
  },
  // 现代低调信息提示标：柔和浅灰底 + 深灰细圆字符，与正文自然融为一体
  helpBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  helpBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 12,
  },
})
