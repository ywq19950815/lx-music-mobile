import { forwardRef, useImperativeHandle, useRef, useState, useCallback, useMemo } from 'react'
import { ScrollView, View, Animated, Easing, PanResponder } from 'react-native'
import Modal, { type ModalType } from '@/components/common/Modal'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useAppColors, useIsDarkTheme, motion } from '@/theme/tokens'
import { useWindowSize } from '@/utils/hooks'

import SettingLyricProgress from './settings/SettingLyricProgress'
import SettingVolume from './settings/SettingVolume'
import SettingPlaybackRate from './settings/SettingPlaybackRate'
import SettingLrcFontSize from './settings/SettingLrcFontSize'
import SettingLrcAlign from './settings/SettingLrcAlign'
import { SheetCard, SheetCloseButton } from './settings/ui'

export interface SettingPopupProps {
  direction: 'vertical' | 'horizontal'
}

export interface SettingPopupType {
  show: () => void
}

/** 下拉关闭阈值 */
const CLOSE_DISTANCE = 96
const CLOSE_VELOCITY = 0.5

export default forwardRef<SettingPopupType, SettingPopupProps>(({ direction }, ref) => {
  const [visible, setVisible] = useState(false)
  const modalRef = useRef<ModalType>(null)
  const t = useI18n()
  const c = useAppColors()
  const isDark = useIsDarkTheme()
  const { height: winHeight } = useWindowSize()

  // ── 进场弹簧上滑 + 抓手下拉关闭 ──────────────────────────
  const translateY = useRef(new Animated.Value(winHeight)).current
  const dragY = useRef(new Animated.Value(0)).current
  const hidingRef = useRef(false)

  const hide = useCallback(() => {
    if (hidingRef.current) return
    hidingRef.current = true
    Animated.timing(translateY, {
      toValue: winHeight,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      hidingRef.current = false
      setVisible(false)
      modalRef.current?.setVisible(false)
    })
  }, [translateY, winHeight])

  useImperativeHandle(ref, () => ({
    show() {
      hidingRef.current = false
      dragY.setValue(0)
      translateY.setValue(winHeight)
      if (visible) modalRef.current?.setVisible(true)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          modalRef.current?.setVisible(true)
        })
      }
    },
  }))

  // 可见后播放上滑进场
  const handleShow = useCallback(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      easing: Easing.bezier(0.2, 0.9, 0.3, 1),
      useNativeDriver: true,
    }).start()
  }, [translateY])
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => !hidingRef.current && g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_e, g) => {
      dragY.setValue(Math.max(0, g.dy))
    },
    onPanResponderRelease: (_e, g) => {
      if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_VELOCITY) {
        hide()
      } else {
        Animated.spring(dragY, {
          toValue: 0,
          friction: motion.spring.friction,
          tension: motion.spring.tension,
          useNativeDriver: true,
        }).start()
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(dragY, {
        toValue: 0,
        friction: motion.spring.friction,
        tension: motion.spring.tension,
        useNativeDriver: true,
      }).start()
    },
  }), [dragY, hide])

  const cardTransform = useMemo(() => [{ translateY: Animated.add(translateY, dragY) }], [translateY, dragY])

  return (
    <Modal
      ref={modalRef}
      bgColor="rgba(15,23,42,0.42)"
      bgHide={false}
      onBgPress={hide}
      onRequestClose={hide}
      onShow={handleShow}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={{
          width: '100%',
          maxHeight: '88%',
          backgroundColor: c.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: 18,
          transform: cardTransform,
        }}>
          {/* 抓手 + 标题栏：支持下拉关闭手势 */}
          <View {...panResponder.panHandlers}>
            {/* grabber 手柄 */}
            <View style={{ alignItems: 'center', paddingTop: 10 }}>
              <View style={{
                width: 38,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : '#CBD5E1',
              }} />
            </View>

            {/* 标题栏 */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 18,
              paddingVertical: 14,
            }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: c.ink, letterSpacing: -0.2 }}>{t('play_detail_setting_title')}</Text>
              <SheetCloseButton
                onPress={hide}
              />
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <SheetCard title={t('play_detail_setting_group_lyric')}>
              <SettingLyricProgress />
              <SettingLrcFontSize direction={direction} />
              <SettingLrcAlign />
            </SheetCard>

            <SheetCard title={t('play_detail_setting_group_play')}>
              <SettingVolume />
              <SettingPlaybackRate />
            </SheetCard>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
})
