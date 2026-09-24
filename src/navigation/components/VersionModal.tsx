import { useMemo, useState, useEffect, memo } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'

import { compareVer, sizeFormate } from '@/utils'
import { colors, radius } from '@/theme/tokens'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { type VersionInfo } from '@/store/version/state'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useVersionDownloadProgressUpdated, useVersionInfo, useVersionInfoIgnoreVersionUpdated } from '@/store/version/hook'
import ModalContent from './ModalContent'
import { checkUpdate, hideModal, setIgnoreVersion } from '@/core/version'

const VersionItem = ({ version, desc }: VersionInfo) => {
  return (
    <View style={styles.versionItem}>
      <Text style={styles.label}>v{version}</Text>
      <Text selectable style={styles.desc}>{desc}</Text>
    </View>
  )
}

const Content = memo(({ title, newVersionInfo }: {
  title: string
  newVersionInfo: VersionInfo | null
}) => {
  const t = useI18n()

  const history = useMemo(() => {
    if (!newVersionInfo?.history) return []
    let arr = []
    for (const ver of newVersionInfo?.history) {
      if (compareVer(currentVer, ver.version) < 0) arr.push(ver)
    }
    return arr
  }, [newVersionInfo])

  return (
    <View style={styles.main}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView style={styles.content} keyboardShouldPersistTaps={'always'}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}>
        <Text style={styles.label}>{t('version_label_latest_ver')}{newVersionInfo?.version}</Text>
        <Text style={styles.label}>{t('version_label_current_ver')}{currentVer}</Text>
        {
          newVersionInfo?.desc
            ? (
                <View>
                  <Text style={styles.label}>{t('version_label_change_log')}</Text>
                  <View style={{ paddingLeft: 10, marginTop: 5 }}>
                    <Text selectable style={styles.desc}>{newVersionInfo.desc}</Text>
                  </View>
                </View>
              )
            : null
        }
        {
          history.length
            ? (
                <View style={styles.history}>
                  <Text style={styles.label}>{t('version_label_history')}</Text>
                  <View style={{ paddingLeft: 10, marginTop: 5 }}>
                    {history.map((item, index) => <VersionItem key={index} version={item.version} desc={item.desc} />)}
                  </View>
                </View>
              )
            : null
        }
      </ScrollView>
    </View>
  )
})

const currentVer = process.versions.app
const VersionModal = ({ componentId }: { componentId: string }) => {
  const theme = useTheme()
  const t = useI18n()
  const versionInfo = useVersionInfo()
  const progress = useVersionDownloadProgressUpdated()
  const ignoreVersion = useVersionInfoIgnoreVersionUpdated()
  const [ignoreBtn, setIgnoreBtn] = useState({ text: t('version_btn_ignore'), show: true, disabled: false })
  const [closeBtnText, setCloseBtnText] = useState(t('version_btn_close'))
  const [confirmBtn, setConfirmBtn] = useState({ text: '', show: true, disabled: false })
  const [title, setTitle] = useState('')
  const [tip, setTip] = useState('')


  useEffect(() => {
    let ignoreBtnConfig = { ...ignoreBtn }
    if (versionInfo.isLatest) {
      setTitle(t('version_title_latest'))
      setTip('')
      ignoreBtnConfig.show = false
      setConfirmBtn({ text: t('version_btn_new'), show: false, disabled: true })
      setCloseBtnText(t('version_btn_close'))
    } else if (versionInfo.isUnknown) {
      setTitle(t('version_title_unknown'))
      setTip(t('version_tip_unknown'))
      ignoreBtnConfig.show = false
      setConfirmBtn({ text: t('version_btn_failed'), show: true, disabled: false })
      setCloseBtnText(t('version_btn_close'))
    } else {
      switch (versionInfo.status) {
        case 'downloading':
          setTitle(t('version_title_new'))
          setTip(t('version_btn_downloading', {
            total: sizeFormate(progress.total),
            current: sizeFormate(progress.current),
            progress: progress.total ? (progress.current / progress.total * 100).toFixed(2) : '0',
          }))
          if (ignoreBtnConfig.show) ignoreBtnConfig.show = false
          if (!confirmBtn.disabled) setConfirmBtn({ text: t('version_btn_update'), show: true, disabled: true })
          setCloseBtnText(t('version_btn_min'))
          break
        case 'downloaded':
          setTitle(t('version_title_update'))
          setTip('')
          if (ignoreBtnConfig.show) ignoreBtnConfig.show = false
          setConfirmBtn({ text: t('version_btn_update'), show: true, disabled: false })
          setCloseBtnText(t('version_btn_close'))
          break
        case 'checking':
          setTitle(t('version_title_checking'))
          setTip('')
          ignoreBtnConfig.show = false
          setConfirmBtn({ text: t('version_btn_new'), show: false, disabled: true })
          setCloseBtnText(t('version_btn_close'))
          break
        case 'error':
          setTitle(t('version_title_failed'))
          setTip(t('version_tip_failed'))
          ignoreBtnConfig.show = true
          ignoreBtnConfig.disabled = false
          setConfirmBtn({ text: t('version_btn_failed'), show: true, disabled: false })
          setCloseBtnText(t('version_btn_close'))
          break
        // case 'idle':
        //   break
        default:
          setTitle(t('version_title_new'))
          setTip('')
          ignoreBtnConfig.show = true
          ignoreBtnConfig.disabled = false
          setConfirmBtn({ text: t('version_btn_new'), show: true, disabled: false })
          // setTip(t('version_btn_new'))
          setCloseBtnText(t('version_btn_close'))
          break
      }
    }
    ignoreBtnConfig.text = t(ignoreVersion == versionInfo.newVersion?.version ? 'version_btn_ignore_cancel' : 'version_btn_ignore')
    setIgnoreBtn(ignoreBtnConfig)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, versionInfo, ignoreVersion, progress])

  const handleCancel = () => {
    hideModal(componentId)
  }
  const handleIgnore = () => {
    setIgnoreVersion(ignoreVersion != versionInfo.newVersion!.version ? versionInfo.newVersion!.version : null)
    // handleCancel()
  }

  const handleConfirm = () => {
    // 在线更新已停用，这里仅刷新一次版本状态（始终为「已是最新」）
    void checkUpdate()
  }

  return (
    <ModalContent>
      <Content title={title} newVersionInfo={versionInfo.newVersion} />
      { tip.length ? <Text style={styles.tip}>{tip}</Text> : null }
      <View style={styles.btns}>
        {
          ignoreBtn.show
            ? (
                <TouchableOpacity
                  disabled={ignoreBtn.disabled}
                  style={[styles.cancelBtn, ignoreBtn.disabled && styles.btnDisabled]}
                  activeOpacity={0.75}
                  onPress={handleIgnore}
                >
                  <Text style={styles.cancelBtnText} size={13}>{ignoreBtn.text}</Text>
                </TouchableOpacity>
              )
            : null
        }
        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.75}
          onPress={handleCancel}
        >
          <Text style={styles.cancelBtnText} size={13}>{closeBtnText}</Text>
        </TouchableOpacity>
        {
          confirmBtn.show
            ? (
                <TouchableOpacity
                  disabled={confirmBtn.disabled}
                  style={[styles.confirmBtn, confirmBtn.disabled && styles.btnDisabled]}
                  activeOpacity={0.75}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmBtnText} size={13}>{confirmBtn.text}</Text>
                </TouchableOpacity>
              )
            : null
        }
      </View>
    </ModalContent>
  )
}

const styles = StyleSheet.create({
  main: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    maxHeight: 280,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 14,
  },
  history: {
    marginTop: 15,
  },
  versionItem: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 3,
  },
  desc: {
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.inkSecondary,
  },
  tip: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    fontSize: 12,
    fontWeight: '500',
    color: colors.brandDeep,
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 9,
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
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  confirmBtnText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.45,
  },
})

export default VersionModal

