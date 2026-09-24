import { useEffect, useState } from 'react'
import { View, ScrollView } from 'react-native'

import Button from '@/components/common/Button'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import ModalContent from './ModalContent'
import syncState from '@/store/sync/state'
import CheckBox from '@/components/common/CheckBox'
import { setSyncModeComponentId } from '@/core/sync'
import { colors, radius } from '@/theme/tokens'


const styles = createStyle({
  main: {
    flexShrink: 1,
    marginTop: 16,
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 16,
  },
  content: {
    flexGrow: 0,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  btnGroup: {
    marginTop: 12,
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 6,
    marginBottom: 6,
  },
  btn: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 14,
    paddingRight: 14,
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
    minWidth: 90,
  },
  tips: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 12,
  },
  tipTitle: {
    fontWeight: '600',
    color: colors.ink,
  },
  tip: {
    paddingBottom: 5,
    color: colors.inkTertiary,
  },
})


const ListModeModal = () => {
  const theme = useTheme()
  const t = useI18n()
  const [isOverwrite, setOverwrite] = useState(false)

  const handleSelectMode = (mode: LX.Sync.List.SyncMode) => {
    if (mode.startsWith('overwrite') && isOverwrite) mode += '_full'
    global.app_event.selectSyncMode({ type: 'list', mode })
  }

  return (
    <>
      <View style={styles.main}>
        <Text style={styles.title} size={16}>{t('sync__list_mode_title', { name: syncState.serverName })}</Text>
        <ScrollView style={styles.content} keyboardShouldPersistTaps={'always'}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}>
          <View style={{ ...styles.btnGroup, marginTop: 0 }}>
            <Text size={14}>{t('sync__mode_merge_tip')}</Text>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('merge_local_remote') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_merge_btn_local_remote')}</Text>
              </Button>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('merge_remote_local') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_merge_btn_remote_local')}</Text>
              </Button>
            </View>
          </View>
          <View style={styles.btnGroup}>
            <Text size={14}>{t('sync__mode_overwrite_label')}</Text>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('overwrite_local_remote') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_overwrite_btn_local_remote')}</Text>
              </Button>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('overwrite_remote_local') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_overwrite_btn_remote_local')}</Text>
              </Button>
            </View>
            <View>
              <CheckBox check={isOverwrite} onChange={setOverwrite} label={t('sync__mode_overwrite')} />
            </View>
          </View>
          <View style={styles.btnGroup}>
            <Text size={14}>{t('sync__mode_other_label')}</Text>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('cancel') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_overwrite_btn_cancel')}</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
      <View style={styles.tips}>
        <Text style={styles.tip} size={12} color={theme['c-600']}>
          <Text style={styles.tipTitle} size={12}>{t('sync__mode_merge_tip')}</Text>
          {t('sync__list_mode_merge_tip_desc')}
        </Text>
        <Text style={styles.tip} size={12} color={theme['c-600']}>
          <Text style={styles.tipTitle} size={12}>{t('sync__mode_overwrite_tip')}</Text>
          {t('sync__list_mode_overwrite_tip_desc')}
        </Text>
        <Text style={styles.tip} size={12} color={theme['c-600']}>
          <Text style={styles.tipTitle} size={12}>{t('sync__mode_other_tip')}</Text>
          {t('sync__list_mode_other_tip_desc')}
        </Text>
      </View>
    </>
  )
}


const DislikeModeModal = () => {
  const theme = useTheme()
  const t = useI18n()
  const handleSelectMode = (mode: LX.Sync.Dislike.SyncMode) => {
    global.app_event.selectSyncMode({ type: 'dislike', mode })
  }

  return (
    <>
      <View style={styles.main}>
        <Text style={styles.title} size={16}>{t('sync__dislike_mode_title', { name: syncState.serverName })}</Text>
        <ScrollView style={styles.content} keyboardShouldPersistTaps={'always'}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}>
          <View style={{ ...styles.btnGroup, marginTop: 0 }}>
            <Text size={14}>{t('sync__mode_merge_tip')}</Text>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('merge_local_remote') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_merge_btn_local_remote')}</Text>
              </Button>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('merge_remote_local') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_merge_btn_remote_local')}</Text>
              </Button>
            </View>
          </View>
          <View style={styles.btnGroup}>
            <Text size={14}>{t('sync__mode_overwrite_label')}</Text>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('overwrite_local_remote') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_overwrite_btn_local_remote')}</Text>
              </Button>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('overwrite_remote_local') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_overwrite_btn_remote_local')}</Text>
              </Button>
            </View>
          </View>
          <View style={styles.btnGroup}>
            <Text size={14}>{t('sync__mode_other_label')}</Text>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('cancel') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_overwrite_btn_cancel')}</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
      <View style={styles.tips}>
        <Text style={styles.tip} size={12} color={theme['c-600']}>
          <Text style={styles.tipTitle} size={12}>{t('sync__mode_merge_tip')}</Text>
          {t('sync__dislike_mode_merge_tip_desc')}
        </Text>
        <Text style={styles.tip} size={12} color={theme['c-600']}>
          <Text style={styles.tipTitle} size={12}>{t('sync__mode_overwrite_tip')}</Text>
          {t('sync__dislike_mode_overwrite_tip_desc')}
        </Text>
        <Text style={styles.tip} size={12} color={theme['c-600']}>
          <Text style={styles.tipTitle} size={12}>{t('sync__mode_other_tip')}</Text>
          {t('sync__dislike_mode_other_tip_desc')}
        </Text>
      </View>
    </>
  )
}

export default ({ componentId }: { componentId: string }) => {
  useEffect(() => {
    setSyncModeComponentId(componentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ModalContent>
      {
        syncState.type == 'list' ? <ListModeModal />
          : syncState.type == 'dislike' ? <DislikeModeModal />
            : null
      }
    </ModalContent>
  )
}

