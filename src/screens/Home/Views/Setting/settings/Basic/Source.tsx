import { memo, useCallback, useMemo, useRef, useState } from 'react'

import { View, TouchableOpacity } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { createStyle, toast } from '@/utils/tools'
import { setApiSource } from '@/core/apiSource'
import { useI18n } from '@/lang'
import apiSourceInfo from '@/utils/musicSdk/api-source-info'
import { useSettingValue } from '@/store/setting/hook'
import { useStatus, useUserApiList } from '@/store/userApi'
import Button from '../../components/Button'
import UserApiEditModal, { type UserApiEditModalType } from './UserApiEditModal'
import Text from '@/components/common/Text'
import { DEFAULT_SOURCE, isDefaultSourceName } from '@/config/defaultSource'
import { installDefaultSource } from '@/core/defaultSource'
import { refreshUserApiList } from '@/core/userApi'
import { neoColors } from '@/theme/neobrutalism'

const apiSourceList = apiSourceInfo.map(api => ({
  id: api.id,
  name: api.name,
  disabled: api.disabled,
}))

const useActive = (id: string) => {
  const activeLangId = useSettingValue('common.apiSource')
  const isActive = useMemo(() => activeLangId == id, [activeLangId, id])
  return isActive
}

const Item = ({ id, name, desc, statusLabel, change }: {
  id: string
  name: string
  desc?: string
  statusLabel?: string
  change: (id: string) => void
}) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return (
    <CheckBox marginBottom={5} check={isActive} onChange={() => { change(id) }} need>
      <Text style={styles.sourceLabel}>
        {name}
        {
          desc ? <Text style={styles.sourceDesc} size={13}>  {desc}</Text> : null
        }
        {
          statusLabel ? <Text style={styles.sourceStatus} size={13}>  {statusLabel}</Text> : null
        }
      </Text>
    </CheckBox>
  )
}

/**
 * 内置默认音源卡片（Neo-Brutalism 波普风）
 *
 * App 首次启动会自动安装该音源；此卡片提供「一键安装 / 重新下载」入口，
 * 方便用户误删后快速恢复，不需要自己去找源。
 */
const DefaultSourceCard = memo(() => {
  const t = useI18n()
  const userApiList = useUserApiList()
  const apiSourceSetting = useSettingValue('common.apiSource')
  const [loading, setLoading] = useState(false)

  const installedApi = useMemo(() => userApiList.find(api => isDefaultSourceName(api.name)), [userApiList])
  const isActive = !!installedApi && installedApi.id == apiSourceSetting

  const handleInstall = useCallback(() => {
    if (loading) return
    setLoading(true)
    void installDefaultSource().then((id) => {
      if (!id) {
        toast(t('user_api_import_failed_tip', { message: 'network error' }), 'long')
        return
      }
      toast(t('user_api_import_success_tip'))
      // 安装完成后刷新 store 里的音源列表，让新音源立刻出现在列表里
      void refreshUserApiList()
    }).finally(() => {
      setLoading(false)
    })
  }, [loading, t])

  const handleActive = useCallback(() => {
    if (!installedApi) return
    setApiSource(installedApi.id)
  }, [installedApi])

  return (
    <View style={styles.defaultCard}>
      <View style={styles.defaultCardHeader}>
        <Text size={14} style={styles.defaultCardTitle}>{DEFAULT_SOURCE.name}</Text>
        <Text size={11} style={styles.defaultCardBadge}>{isActive ? '使用中' : installedApi ? '已安装' : '未安装'}</Text>
      </View>
      <Text size={11} style={styles.defaultCardDesc} numberOfLines={2}>
        内置音源，开箱即用。首次启动自动安装，无需手动找源。
      </Text>
      <View style={styles.defaultCardBtns}>
        <TouchableOpacity
          style={{ ...styles.defaultBtn, ...styles.defaultBtnPrimary }}
          onPress={installedApi ? handleActive : handleInstall}
          disabled={loading}
        >
          <Text size={12} style={styles.defaultBtnText}>
            {loading ? '安装中…' : installedApi ? (isActive ? '当前音源' : '启用') : '一键安装'}
          </Text>
        </TouchableOpacity>
        {installedApi
          ? (
              <TouchableOpacity style={{ ...styles.defaultBtn, ...styles.defaultBtnGhost }} onPress={handleInstall} disabled={loading}>
                <Text size={12} style={styles.defaultBtnGhostText}>重新下载</Text>
              </TouchableOpacity>
            )
          : null}
      </View>
    </View>
  )
})

export default memo(() => {
  const t = useI18n()
  const list = useMemo(() => apiSourceList.map(s => ({
    // @ts-expect-error
    name: t(`setting_basic_source_${s.id}`) || s.name,
    id: s.id,
  })), [t])
  const setApiSourceId = useCallback((id: string) => {
    setApiSource(id)
  }, [])
  const userApiListRaw = useUserApiList()
  const apiStatus = useStatus()
  const apiSourceSetting = useSettingValue('common.apiSource')
  const userApiList = useMemo(() => {
    const getApiStatus = () => {
      let status
      if (apiStatus.status) status = t('setting_basic_source_status_success')
      else if (apiStatus.message == 'initing') status = t('setting_basic_source_status_initing')
      else if (apiStatus.message == 'init_timeout') status = t('setting_basic_source_status_timeout')
      else status = t('setting_basic_source_status_failed')

      return status
    }
    return userApiListRaw.map(api => {
      const statusLabel = api.id == apiSourceSetting ? `[${getApiStatus()}]` : ''
      return {
        id: api.id,
        name: api.name,
        label: `${api.name}${statusLabel}`,
        desc: [/^\d/.test(api.version) ? `v${api.version}` : api.version].filter(Boolean).join(', '),
        statusLabel,
        // status: apiStatus.status,
        // message: apiStatus.message,
        // disabled: false,
      }
    })
  }, [userApiListRaw, apiStatus, apiSourceSetting, t])

  const modalRef = useRef<UserApiEditModalType>(null)
  const handleShow = () => {
    modalRef.current?.show()
  }

  return (
    <SubTitle title={t('setting_basic_source')}>
      <DefaultSourceCard />
      <View style={styles.list}>
        {
          list.map(({ id, name }) => <Item name={name} id={id} key={id} change={setApiSourceId} />)
        }
        {
          userApiList.map(({ id, name, desc, statusLabel }) => <Item name={name} desc={desc} statusLabel={statusLabel} id={id} key={id} change={setApiSourceId} />)
        }
      </View>
      <View style={styles.btn}>
        <Button onPress={handleShow}>{t('setting_basic_source_user_api_btn')}</Button>
      </View>
      <UserApiEditModal ref={modalRef} />
    </SubTitle>
  )
})

const styles = createStyle({
  list: {
    flexGrow: 0,
    flexShrink: 1,
    // flexDirection: 'row',
    // flexWrap: 'wrap',
  },
  btn: {
    marginTop: 10,
    flexDirection: 'row',
  },
  // ===== 内置默认音源卡片（Neo-Brutalism） =====
  defaultCard: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#141414',
    borderRadius: 6,
    backgroundColor: '#FFE600',
    // 纯黑实体硬阴影
    shadowColor: '#141414',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  defaultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  defaultCardTitle: {
    fontWeight: '900',
    color: '#141414',
    flexShrink: 1,
  },
  defaultCardBadge: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#141414',
    borderRadius: 3,
    backgroundColor: '#141414',
    color: '#FFE600',
    fontWeight: '900',
    overflow: 'hidden',
  },
  defaultCardDesc: {
    color: '#141414',
    marginBottom: 10,
    lineHeight: 16,
  },
  defaultCardBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  defaultBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#141414',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBtnPrimary: {
    backgroundColor: '#141414',
  },
  defaultBtnGhost: {
    backgroundColor: 'transparent',
  },
  defaultBtnText: {
    color: '#FFE600',
    fontWeight: '900',
  },
  defaultBtnGhostText: {
    color: '#141414',
    fontWeight: '900',
  },
  sourceLabel: {
    // 音源名称：纯黑加粗，在纯白卡片上保持最高可读性
    color: neoColors.black,
    fontWeight: '700',
  },
  sourceDesc: {
    // 版本号：用中性深灰而非主题色，避免深色主题下变成浅灰看不清
    color: neoColors.gray700,
    fontWeight: '600',
  },
  sourceStatus: {
    // 状态文案（[初始化成功] 等）：同上，显式指定深色
    color: neoColors.gray700,
    fontWeight: '600',
  },
})
