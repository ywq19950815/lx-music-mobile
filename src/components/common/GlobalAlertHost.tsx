import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import Dialog, { type DialogType } from './Dialog'
import Text from './Text'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'
import { type GlobalAlertOptions } from '@/event/appEvent'

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

  if (!config) return null

  const showCancel = config.showCancel ?? true
  const bgClose = config.bgClose ?? true

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
          <Text style={styles.textBody} size={13.5} color={neoColors.black}>
            {config.message}
          </Text>
        </ScrollView>
      </View>
      <View style={styles.btns}>
        {showCancel ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.75}
            onPress={handleCancel}
          >
            <Text style={styles.btnText} size={13} color={neoColors.black}>
              {config.cancelButtonText || '取消'}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.confirmBtn}
          activeOpacity={0.75}
          onPress={handleConfirm}
        >
          <Text style={styles.btnText} size={13} color={neoColors.black}>
            {config.confirmButtonText || '确定'}
          </Text>
        </TouchableOpacity>
      </View>
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
    lineHeight: 21,
    fontWeight: '600',
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 7.5,
    paddingHorizontal: 16,
    borderRadius: neoBorders.radiusPill,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    backgroundColor: neoColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...neoShadows.sm,
  },
  confirmBtn: {
    paddingVertical: 7.5,
    paddingHorizontal: 18,
    borderRadius: neoBorders.radiusPill,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    backgroundColor: neoColors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    ...neoShadows.sm,
  },
  btnText: {
    fontWeight: '800',
  },
})
