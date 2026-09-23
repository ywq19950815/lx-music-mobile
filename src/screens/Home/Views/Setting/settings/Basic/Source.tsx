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
import {
  BUILTIN_SOURCE_METAS,
  DEFAULT_SOURCE,
  isBuiltinSourceName,
  isDefaultSourceName,
} from '@/config/defaultSource'
import { findInstalledDefaultSource, installAllBuiltinSources } from '@/core/defaultSource'
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

const Item = ({ id, name, desc, statusLabel, isBuiltin, change }: {
  id: string
  name: string
  desc?: string
  statusLabel?: string
  isBuiltin?: boolean
  change: (id: string) => void
}) => {
  const isActive = useActive(id)
  return (
    <CheckBox marginBottom={6} check={isActive} onChange={() => { change(id) }} need>
      <Text style={styles.sourceLabel}>
        {name}
        {isBuiltin ? <Text style={styles.builtinTag} size={11}> [内置]</Text> : null}
        {
          desc ? <Text style={styles.sourceDesc} size={12}>  {desc}</Text> : null
        }
        {
          statusLabel ? <Text style={styles.sourceStatus} size={12}>  {statusLabel}</Text> : null
        }
      </Text>
    </CheckBox>
  )
}

/**
 * 内置优质音源库卡片（Neo-Brutalism 波普风）
 *
 * 聚合 awaw.cc 推荐的 10 款稳定音源（全豆要、六音、长青、独家、Huibq、野花、幻音、ikun、野草、聚合API），
 * 用户可在下方音源列表中任意点击单选框秒切；本卡片提供状态概览与一键重置恢复能力。
 */
const BuiltinSourceHubCard = memo(() => {
  const t = useI18n()
  const userApiList = useUserApiList()
  const apiSourceSetting = useSettingValue('common.apiSource')
  const [loading, setLoading] = useState(false)

  // 统计已安装的内置音源数量
  const installedBuiltinCount = useMemo(() => {
    return BUILTIN_SOURCE_METAS.filter(meta =>
      userApiList.some(api => api.name === meta.name || api.name.includes(meta.alias)),
    ).length
  }, [userApiList])

  // 当前激活的音源
  const currentActiveApi = useMemo(() => {
    return userApiList.find(api => api.id === apiSourceSetting)
  }, [userApiList, apiSourceSetting])

  // 恢复/补全全部 10 款内置音源
  const handleRestoreAll = useCallback(() => {
    if (loading) return
    setLoading(true)
    void installAllBuiltinSources(true).then(({ defaultSourceId, totalInstalled }) => {
      toast(`已成功就绪 ${totalInstalled || 10} 款内置音源！`)
      void refreshUserApiList()
      // 若当前未激活有效音源，自动切换到默认源
      if (!apiSourceSetting && defaultSourceId) {
        setApiSource(defaultSourceId)
      }
    }).catch((err) => {
      toast(t('user_api_import_failed_tip', { message: String(err?.message ?? err) }), 'long')
    }).finally(() => {
      setLoading(false)
    })
  }, [loading, t, apiSourceSetting])

  // 快速切回默认推荐源（全豆要）
  const handleSwitchToDefault = useCallback(() => {
    void findInstalledDefaultSource().then((defaultId) => {
      if (defaultId) {
        setApiSource(defaultId)
        toast('已切换为推荐音源：全豆要[聚合音源]')
      } else {
        handleRestoreAll()
      }
    })
  }, [handleRestoreAll])

  const isCurrentDefault = currentActiveApi && isDefaultSourceName(currentActiveApi.name)

  return (
    <View style={styles.defaultCard}>
      <View style={styles.defaultCardHeader}>
        <Text size={15} style={styles.defaultCardTitle}>内置优质音源库 (10款)</Text>
        <Text size={11} style={styles.defaultCardBadge}>
          {installedBuiltinCount >= 10 ? '全套已就绪' : `已安装 ${installedBuiltinCount}/10`}
        </Text>
      </View>
      <Text size={11} style={styles.defaultCardDesc} numberOfLines={2}>
        已内置全豆要、六音、长青、独家、Huibq、野花、幻音、ikun、野草、聚合API等 10 款优质音源。下方点击单选框即可自由切换！
      </Text>
      <View style={styles.defaultCardBtns}>
        <TouchableOpacity
          style={{ ...styles.defaultBtn, ...styles.defaultBtnPrimary }}
          onPress={handleRestoreAll}
          disabled={loading}
        >
          <Text size={12} style={styles.defaultBtnText}>
            {loading ? '安装中…' : installedBuiltinCount >= 10 ? '恢复/重置全部源' : '一键补全10款源'}
          </Text>
        </TouchableOpacity>
        {!isCurrentDefault ? (
          <TouchableOpacity
            style={{ ...styles.defaultBtn, ...styles.defaultBtnGhost }}
            onPress={handleSwitchToDefault}
            disabled={loading}
          >
            <Text size={12} style={styles.defaultBtnGhostText}>切回推荐默认源</Text>
          </TouchableOpacity>
        ) : null}
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
      const isBuiltin = isBuiltinSourceName(api.name)
      return {
        id: api.id,
        name: api.name,
        isBuiltin,
        label: `${api.name}${statusLabel}`,
        desc: [/^\d/.test(api.version) ? `v${api.version}` : api.version].filter(Boolean).join(', '),
        statusLabel,
      }
    })
  }, [userApiListRaw, apiStatus, apiSourceSetting, t])

  const modalRef = useRef<UserApiEditModalType>(null)
  const handleShow = () => {
    modalRef.current?.show()
  }

  return (
    <SubTitle title={t('setting_basic_source')}>
      <BuiltinSourceHubCard />
      <View style={styles.list}>
        {
          list.map(({ id, name }) => <Item name={name} id={id} key={id} change={setApiSourceId} />)
        }
        {
          userApiList.map(({ id, name, desc, statusLabel, isBuiltin }) => (
            <Item
              name={name}
              desc={desc}
              statusLabel={statusLabel}
              isBuiltin={isBuiltin}
              id={id}
              key={id}
              change={setApiSourceId}
            />
          ))
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
  },
  btn: {
    marginTop: 10,
    flexDirection: 'row',
  },
  // ===== 内置音源库卡片（Neo-Brutalism） =====
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
    color: neoColors.black,
    fontWeight: '700',
  },
  sourceDesc: {
    color: neoColors.gray700,
    fontWeight: '600',
  },
  sourceStatus: {
    color: neoColors.gray700,
    fontWeight: '600',
  },
  builtinTag: {
    color: '#00875A', // 翠绿醒目标识
    fontWeight: '800',
  },
})
