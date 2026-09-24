import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import { View } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { colors } from '@/theme/tokens'
import { useI18n } from '@/lang'
// import SourceSelector, { type SourceSelectorProps, type SourceSelectorType } from '../SourceSelector'
import { type Source } from '@/store/songlist/state'

interface IdInputType {
  setText: (text: string) => void
  getText: () => string
  focus: () => void
}
const IdInput = forwardRef<IdInputType, {}>((props, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)

  useImperativeHandle(ref, () => ({
    getText() {
      return text.trim()
    },
    setText(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    },
  }))

  return (
    <Input
      ref={inputRef}
      placeholder={t('songlist_open_input_placeholder')}
      value={text}
      onChangeText={setText}
      style={{ ...styles.input, backgroundColor: theme['c-primary-input-background'] }}
    />
  )
})


export interface ModalProps {
  onOpenId: (id: string) => void
  // onSourceChange: SourceSelectorProps['onSourceChange']
}
export interface ModalType {
  show: (source: Source) => void
}

export default forwardRef<ModalType, ModalProps>(({ onOpenId }, ref) => {
  const alertRef = useRef<ConfirmAlertType>(null)
  // const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const inputRef = useRef<IdInputType>(null)
  const [visible, setVisible] = useState(false)
  const t = useI18n()

  const handleShow = (source: Source) => {
    alertRef.current?.setVisible(true)
    requestAnimationFrame(() => {
      inputRef.current?.setText('')
      // sourceSelectorRef.current?.setSource(source)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    })
  }
  useImperativeHandle(ref, () => ({
    show(source) {
      if (visible) handleShow(source)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow(source)
        })
      }
    },
  }))

  const handleConfirm = () => {
    let id = inputRef.current?.getText() ?? ''
    if (!id.length) return
    if (id.length > 500) id = id.substring(0, 500)
    alertRef.current?.setVisible(false)
    onOpenId(id)
  }

  return (
    visible
      ? <ConfirmAlert
          ref={alertRef}
          onConfirm={handleConfirm}
        >
          <View style={styles.content}>
            <View style={styles.col}>
              {/* <SourceSelector style={{ ...styles.selector, backgroundColor: theme['c-primary-input-background'] }} ref={sourceSelectorRef} onSourceChange={onSourceChange} /> */}
              <IdInput ref={inputRef} />
            </View>
            <Text style={styles.inputTipText} size={13} color={colors.inkSecondary}>{t('songlist_open_input_tip')}</Text>
          </View>
        </ConfirmAlert>
      : null
  )
})


const styles = createStyle({
  content: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
  },
  col: {
    flexDirection: 'row',
    height: 38,
  },
  // selector: {
  //   borderTopLeftRadius: 4,
  //   borderBottomLeftRadius: 4,
  // },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    // ⚠️ 不要写死 minWidth —— 这里曾是 `minWidth: 290`（且未经 scaleSizeW 缩放），
    // 在 289px 宽的弹窗内容区里会把输入框撑到 303px，右侧 14px 溢出后
    // 被 Dialog 卡片的 overflow:hidden 裁掉（症状：输入框右边框被切）。
    // 用 minWidth: 0 让 flex 正常收缩，宽度完全交给父容器。
    minWidth: 0,
    height: '100%',
  },
  inputTipText: {
    marginTop: 15,
    // ⚠️ 必须显式给 lineHeight —— 不设时 Web/RN 取 'normal'（≈1.2 倍字号），
    // 中文字符在 normal 行高下算得偏高，容易让末行触到 Dialog 内 ScrollView 的
    // maxHeight 上限而被截断（症状：文字下面被切、读不到最后一行）。
    // 13px 字号配 19px 行高，既保证中文可读又让文本稳定落在限高内。
    lineHeight: 19,
  },
})


