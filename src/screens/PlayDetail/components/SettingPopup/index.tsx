import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import Modal, { type ModalType } from '@/components/common/Modal'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useAppColors, useIsDarkTheme } from '@/theme/tokens'

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

export default forwardRef<SettingPopupType, SettingPopupProps>(({ direction }, ref) => {
  const [visible, setVisible] = useState(false)
  const modalRef = useRef<ModalType>(null)
  const t = useI18n()
  const c = useAppColors()
  const isDark = useIsDarkTheme()

  useImperativeHandle(ref, () => ({
    show() {
      if (visible) modalRef.current?.setVisible(true)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          modalRef.current?.setVisible(true)
        })
      }
    },
  }))

  const handleHide = () => setVisible(false)

  return (
    <Modal
      ref={modalRef}
      bgColor="rgba(15,23,42,0.42)"
      onHide={handleHide}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={{
          width: '100%',
          maxHeight: '88%',
          backgroundColor: c.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: 18,
        }}>
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
            <Text style={{ fontSize: 18, fontWeight: '700', color: c.ink }}>{t('play_detail_setting_title')}</Text>
            <SheetCloseButton
              onPress={() => modalRef.current?.setVisible(false)}
              color={isDark ? 'rgba(255,255,255,0.09)' : '#F1F5F9'}
            />
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
        </View>
      </View>
    </Modal>
  )
})
