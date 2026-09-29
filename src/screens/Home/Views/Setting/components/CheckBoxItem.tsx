import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Switch, TouchableOpacity, View, StyleSheet } from 'react-native'

import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
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

/**
 * iOS 式开关设置行（替代旧「方块复选框 + 文字」）：
 * - 左侧文字（可点按切换）+ 可选「?」帮助圆点，右侧 iOS Switch
 * - 开启态品牌绿、关闭态浅灰轨道
 * - need 语义与旧版一致：勾选后锁定不可关闭
 */
export default memo(({
  check,
  label,
  children,
  onChange,
  helpTitle,
  helpDesc,
  disabled = false,
  need = false,
  size = 1,
  marginRight = 0,
  marginBottom = 0,
}: CheckBoxProps) => {
  const [forced, setForced] = useState(false)
  const alertRef = useRef<ConfirmAlertType>(null)

  useEffect(() => {
    setForced(need && check)
  }, [need, check])

  const isOff = disabled || forced

  const handlePress = useCallback(() => {
    if (isOff) return
    onChange(!check)
  }, [isOff, check, onChange])

  const handleShowHelp = useCallback(() => {
    alertRef.current?.setVisible(true)
  }, [])

  return (
    <View
      style={[
        styles.container,
        marginRight ? { marginRight } : null,
        marginBottom ? { marginBottom } : null,
      ]}
    >
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.6}
        onPress={handlePress}
        disabled={isOff}
      >
        <View style={styles.labelWrap}>
          {label ? (
            <Text
              style={{ color: isOff ? colors.inkTertiary : colors.ink }}
              size={14 * size}
            >
              {label}
            </Text>
          ) : children}
        </View>
        {(helpTitle ?? helpDesc) ? (
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={handleShowHelp}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.helpBtnText} size={10}>?</Text>
          </TouchableOpacity>
        ) : null}
        <Switch
          value={check}
          onValueChange={onChange}
          disabled={isOff}
          trackColor={{ false: '#E2E8F0', true: colors.brand }}
          thumbColor="#FFFFFF"
          style={styles.switch}
        />
      </TouchableOpacity>
      {(helpTitle ?? helpDesc) ? (
        <ConfirmAlert
          ref={alertRef}
          title={helpTitle || (typeof label === 'string' ? label : '') || '提示说明'}
          text={helpDesc ?? ''}
          showCancel={false}
          confirmText={global.i18n?.t('understand') || '我知道了'}
          onConfirm={() => alertRef.current?.setVisible(false)}
        />
      ) : null}
    </View>
  )
})

const styles = createStyle({
  container: {
    flexGrow: 0,
    flexShrink: 1,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  row: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelWrap: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    flexGrow: 0,
    marginLeft: 12,
    transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }],
  },
  // 低干扰帮助圆点，视觉语言与全局「?」一致
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
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 12,
  },
})
