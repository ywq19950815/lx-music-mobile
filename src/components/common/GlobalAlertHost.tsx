import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import Dialog, { type DialogType } from './Dialog'
import Text from './Text'
import { colors, radius } from '@/theme/tokens'
import { type GlobalAlertOptions, type GlobalAlertAction } from '@/event/appEvent'

/**
 * 全局新粗野主义（Neo-Brutalism）弹窗宿主
 * 统一承接 confirmDialog / tipDialog 以及全局 Alert.alert 调用。
 * 提供亮黄顶栏、小黑圆点、粗黑边框、硬阴影、波普胶囊按钮风格。
 */
export default () => {
  const dialogRef = useRef<DialogType>(null)
  const [config, setConfig] = useState<GlobalAlertOptions | null>(null)
  const activeRef = useRef<GlobalAlertOptions | null>(null)

  useEffect(() => {
    // 1. 响应 app_event.showGlobalAlert（由 confirmDialog / tipDialog 触发）
    const handleShow = (options: GlobalAlertOptions) => {
      activeRef.current = options
      setConfig(options)
      requestAnimationFrame(() => {
        dialogRef.current?.setVisible(true)
      })
    }

    // 2. 挂载到 globalThis 上便于 Alert.alert 桥接兜底
    globalThis.__lxEmitAlert = (title: string, message: string, buttons?: any[]) => {
      const btns = buttons && buttons.length ? buttons : [{ text: '确定' }]

      // 多选项模式（如通知权限 / 电池优化白名单的 3 个选项）→ 纵向按钮列表
      if (btns.length > 2) {
        handleShow({
          title: title || '提示',
          message: String(message || ''),
          actions: btns.map((btn: any, index: number) => ({
            text: btn?.text || `选项 ${index + 1}`,
            style: index === btns.length - 1 ? 'primary' : 'default',
            onPress: () => btn?.onPress?.(),
          })),
          onConfirm: () => {},
          onCancel: () => {},
        })
        return
      }

      const isConfirm = btns.length > 1
      const cancelBtn = isConfirm ? btns[0] : null
      const confirmBtn = isConfirm ? btns[1] : btns[0]

      handleShow({
        title: title || '提示',
        message: String(message || ''),
        showCancel: isConfirm,
        cancelButtonText: cancelBtn?.text || '取消',
        confirmButtonText: confirmBtn?.text || '确定',
        onCancel: () => cancelBtn?.onPress?.(),
        onConfirm: () => confirmBtn?.onPress?.(),
      })
    }

    global.app_event?.on?.('showGlobalAlert', handleShow)
    return () => {
      global.app_event?.off?.('showGlobalAlert', handleShow)
      globalThis.__lxEmitAlert = null
    }
  }, [])

  const handleCancel = useCallback(() => {
    dialogRef.current?.setVisible(false)
    const cb = activeRef.current?.onCancel
    activeRef.current = null
    cb?.()
  }, [])

  const handleConfirm = useCallback(() => {
    dialogRef.current?.setVisible(false)
    const cb = activeRef.current?.onConfirm
    activeRef.current = null
    cb?.()
  }, [])

  const handleHide = useCallback(() => {
    if (activeRef.current) {
      const cb = activeRef.current.onCancel
      activeRef.current = null
      cb?.()
    }
  }, [])

  const handleAction = useCallback((action: GlobalAlertAction) => {
    dialogRef.current?.setVisible(false)
    activeRef.current = null
    action.onPress?.()
  }, [])

  if (!config) return null

  const showCancel = config.showCancel ?? true
  const bgClose = config.bgClose ?? true
  const actions = config.actions?.length ? config.actions : null

  return (
    <Dialog
      ref={dialogRef}
      title={config.title || '提示'}
      bgHide={bgClose}
      keyHide={bgClose}
      closeBtn={true}
      onHide={handleHide}
    >
      <View style={styles.main}>
        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <Text style={styles.textBody} size={13.5} color={colors.inkSecondary}>
            {config.message}
          </Text>
        </ScrollView>
      </View>
      {actions ? (
        <View style={styles.actionsCol}>
          {actions.map((action, index) => {
            const isPrimary = action.style === 'primary'
            const isDanger = action.style === 'danger'
            let textColor = colors.inkSecondary
            if (isPrimary) textColor = '#FFFFFF'
            else if (isDanger) textColor = '#DC2626'

            return (
              <TouchableOpacity
                key={`${action.text}-${index}`}
                style={[
                  styles.actionBtn,
                  isPrimary
                    ? styles.actionBtnPrimary
                    : isDanger ? styles.actionBtnDanger : styles.actionBtnDefault,
                ]}
                activeOpacity={0.75}
                onPress={() => handleAction(action)}
              >
                <Text
                  style={styles.btnText}
                  size={13}
                  color={textColor}
                >
                  {action.text}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      ) : (
        <View style={styles.btns}>
          {showCancel ? (
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.75}
              onPress={handleCancel}
            >
              <Text style={styles.cancelBtnText} size={13}>
                {config.cancelButtonText || '取消'}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.confirmBtn}
            activeOpacity={0.75}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmBtnText} size={13}>
              {config.confirmButtonText || '确定'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Dialog>
  )
}

const styles = StyleSheet.create({
  main: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  content: {
    maxHeight: 260,
  },
  textBody: {
    lineHeight: 22,
    fontWeight: '400',
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 7.5,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  confirmBtn: {
    paddingVertical: 7.5,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnText: {
    fontWeight: '600',
  },
  actionsCol: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDefault: {
    backgroundColor: '#F3F4F6',
  },
  actionBtnPrimary: {
    backgroundColor: colors.brand,
  },
  actionBtnDanger: {
    backgroundColor: '#FEE2E2',
  },
})
