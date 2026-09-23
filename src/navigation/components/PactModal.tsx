import { useMemo, useState, useEffect } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Navigation } from 'react-native-navigation'

import { tipDialog } from '@/utils/tools'
import { useSettingValue } from '@/store/setting/hook'
import Text from '@/components/common/Text'
import ModalContent from './ModalContent'
import { exitApp } from '@/utils/nativeModules/utils'
import { updateSetting } from '@/core/common'
import { checkUpdate } from '@/core/version'
import { initDeeplink } from '@/core/init/deeplink'
import settingState from '@/store/setting/state'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

const Content = () => {
  return (
    <View style={styles.main}>
      <Text style={styles.title} size={17}>用户使用许可协议</Text>
      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {!settingState.setting['common.isAgreePact'] && (
          <Text selectable style={styles.bold}>
            在使用本软件前，你（使用者）需签署本协议才可继续使用！{'\n'}
          </Text>
        )}
        <Text selectable style={styles.text}>
          词语约定：本协议中的“本项目”指 Andy Music（安迪音乐）移动版；“使用者”指签署本协议的使用者；“官方音乐平台”指对本项目内置的各音源平台的统称；“版权数据”指包括但不限于图像、音频、名字等在内的他人拥有所属版权的数据。{'\n'}
        </Text>
        <Text selectable style={styles.bold}>一、数据来源{'\n'}</Text>
        <Text selectable style={styles.text}>
          1.1 本项目的数据来源原理是从各公开服务器中拉取数据，经过对数据简单筛选后进行展示，本项目不对数据的准确性负责。{'\n'}
        </Text>
        <Text selectable style={styles.text}>
          1.2 本项目本身不存储音频数据，使用的在线音频来源来自设置内各音源返回的公开链接。{'\n'}
        </Text>
        <Text selectable style={styles.text}>
          1.3 本项目的列表数据（如我的列表）来自使用者本地系统或连接的同步服务，使用者需对其合法性负责。{'\n'}
        </Text>
        <Text selectable style={styles.bold}>二、版权声明{'\n'}</Text>
        <Text selectable style={styles.text}>
          2.1 使用本项目的过程中产生的版权数据归原作者所有，请在 24 小时内清除。请尊重版权，支持正版音乐。{'\n'}
        </Text>
        <Text selectable style={styles.bold}>三、免责声明{'\n'}</Text>
        <Text selectable style={styles.text}>
          3.1 由于使用本项目产生的任何直接或间接影响由使用者自行负责。{'\n'}
        </Text>
        <Text selectable style={styles.text}>
          3.2 禁止在违反当地法律法规的情况下使用本项目。{'\n'}
        </Text>
        <Text selectable style={styles.bold}>四、完全免费{'\n'}</Text>
        <Text selectable style={styles.text}>
          4.1 本项目完全免费，仅供个人技术研究与日常学习，不接受任何商业合作。{'\n'}
        </Text>
        <Text selectable style={styles.text}>
          * 若协议更新，以软件最新说明为准。
        </Text>
      </ScrollView>
    </View>
  )
}

const Footer = ({ componentId }: { componentId: string }) => {
  const isAgreePact = useSettingValue('common.isAgreePact')
  const [time, setTime] = useState(10)

  const handleRejct = () => {
    exitApp()
  }

  const handleConfirm = () => {
    let _isAgreePact = isAgreePact
    if (!isAgreePact) updateSetting({ 'common.isAgreePact': true })
    void Navigation.dismissOverlay(componentId)
    if (!_isAgreePact) {
      setTimeout(() => {
        void tipDialog({
          title: '温馨提示',
          message: '本软件完全免费，如果你是花钱购买的，请直接申请退款并举报商家！\n\nThis software is completely free.',
          btnText: '好的 (OK)',
        }).then(() => {
          void checkUpdate()
          void initDeeplink()
        })
      }, 500)
    }
  }

  const confirmBtn = useMemo(() => {
    if (isAgreePact) return { disabled: false, text: '关闭' }
    return time ? { disabled: true, text: `同意（${time}s）` } : { disabled: false, text: '同意并继续' }
  }, [isAgreePact, time])

  useEffect(() => {
    if (isAgreePact) return
    const timer = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          clearInterval(timer)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isAgreePact])

  return (
    <>
      {!isAgreePact && (
        <Text selectable style={styles.tip} size={12}>
          点击“同意并继续”即代表你已充分阅读并接受上述许可协议。
        </Text>
      )}
      <View style={styles.btns}>
        {!isAgreePact && (
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.75}
            onPress={handleRejct}
          >
            <Text style={styles.btnText} color={neoColors.black} size={13}>
              拒绝并退出
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          disabled={confirmBtn.disabled}
          style={[styles.confirmBtn, confirmBtn.disabled && styles.btnDisabled]}
          activeOpacity={0.75}
          onPress={handleConfirm}
        >
          <Text style={styles.btnText} color={neoColors.black} size={13}>
            {confirmBtn.text}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  )
}

const PactModal = ({ componentId }: { componentId: string }) => {
  return (
    <ModalContent>
      <Content />
      <Footer componentId={componentId} />
    </ModalContent>
  )
}

const styles = StyleSheet.create({
  main: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  content: {
    maxHeight: 280,
  },
  title: {
    fontWeight: '900',
    color: neoColors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
    color: neoColors.gray700,
  },
  bold: {
    fontSize: 13,
    fontWeight: '800',
    color: neoColors.black,
    marginTop: 4,
    marginBottom: 2,
  },
  tip: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    color: neoColors.gray600,
    lineHeight: 16,
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: neoBorders.radiusPill,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    backgroundColor: neoColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...neoShadows.sm,
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: neoBorders.radiusPill,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    backgroundColor: neoColors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    ...neoShadows.sm,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    fontWeight: '900',
  },
})

export default PactModal
