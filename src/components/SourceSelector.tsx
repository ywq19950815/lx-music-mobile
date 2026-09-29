import React, { forwardRef, type Ref, useImperativeHandle, useMemo, useState, useRef, useCallback } from 'react'
import {
  View,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
} from 'react-native'

import Modal, { type ModalType } from '@/components/common/Modal'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { colors } from '@/theme/tokens'

type Sources = Readonly<Array<LX.OnlineSource | 'all'>>

/**
 * 各音源的品牌识别色与单字标识：
 * 让「5 个平台」一眼可辨，而不是一排神秘代号。
 */
const SOURCE_META: Record<string, { char: string; color: string }> = {
  all: { char: '聚', color: '#31C27C' },
  kw: { char: '蜗', color: '#FE9403' },
  kg: { char: '枸', color: '#00A9FF' },
  tx: { char: '秋', color: '#31C27C' },
  wy: { char: '芸', color: '#EC4141' },
  mg: { char: '蜜', color: '#018BE6' },
}

export interface SourceSelectorProps<S extends Sources> {
  fontSize?: number
  center?: boolean
  integrated?: boolean
  onSourceChange: (source: S[number]) => void
}

export interface SourceSelectorType<S extends Sources> {
  setSourceList: (list: S, activeSource: S[number]) => void
}

export const useSourceListI18n = (list: Sources) => {
  const sourceNameType = useSettingValue('common.sourceNameType')
  const t = useI18n()
  return useMemo(() => {
    return list.map(s => ({ label: t(`source_${sourceNameType}_${s}`), action: s }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, sourceNameType, t])
}

const styles = StyleSheet.create({
  // 顶部触发胶囊按钮
  sourceMenu: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  sourceMenuIntegrated: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
    paddingRight: 6,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  sourceMenuText: {
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  arrowIcon: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkSecondary,
    marginLeft: 3,
  },
  // 底部抽屉遮罩
  mask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  // 抽屉面板容器
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '75%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 20,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E6EB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  // 标题栏
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 提示条
  tipBar: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipText: {
    fontSize: 11.5,
    color: colors.inkSecondary,
    fontWeight: '500',
    flex: 1,
  },
  // 单列平台列表：每行 = 品牌色圆标 + 名称 + 一句话介绍
  listWrap: {
    gap: 8,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 60,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  sourceRowActive: {
    backgroundColor: 'rgba(49, 194, 124, 0.10)',
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  sourceRowInactive: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  sourceAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rowTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  rowDesc: {
    fontSize: 11.5,
    color: colors.inkSecondary,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

const Component = <S extends Sources>(
  { fontSize = 13, center, integrated, onSourceChange }: SourceSelectorProps<S>,
  ref: Ref<SourceSelectorType<S>>
) => {
  const sourceNameType = useSettingValue('common.sourceNameType')
  const [list, setList] = useState([] as unknown as S)
  const [source, setSource] = useState<S[number]>('kw')
  const t = useI18n()

  const modalRef = useRef<ModalType>(null)
  const [visible, setVisible] = useState(false)
  const slideAnim = useRef(new Animated.Value(300)).current

  useImperativeHandle(ref, () => ({
    setSourceList(newList, activeSource) {
      setList(newList)
      setSource(activeSource)
    },
  }), [])

  const sourceList_t = useSourceListI18n(list)

  const showSheet = useCallback(() => {
    setVisible(true)
    modalRef.current?.setVisible(true)
    slideAnim.setValue(300)
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [slideAnim])

  const hideSheet = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 170,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setVisible(false)
      modalRef.current?.setVisible(false)
    })
  }, [slideAnim])

  const handleSelectSource = (selectedSource: S[number]) => {
    if (selectedSource === source) {
      hideSheet()
      return
    }
    hideSheet()
    setTimeout(() => {
      onSourceChange(selectedSource)
      setSource(selectedSource)
    }, 60)
  }

  const currentLabel = useMemo(() => {
    return t(`source_${sourceNameType}_${source}`)
  }, [source, sourceNameType, t])

  return (
    <>
      {/* 顶部触发胶囊按钮 */}
      <TouchableOpacity
        style={integrated ? styles.sourceMenuIntegrated : styles.sourceMenu}
        activeOpacity={0.8}
        onPress={showSheet}
      >
        <Text style={styles.sourceMenuText} numberOfLines={1} size={fontSize}>
          {currentLabel}
        </Text>
        <Text style={styles.arrowIcon}>▾</Text>
      </TouchableOpacity>

      {/* 新粗野主义底部音源选择抽屉 */}
      <Modal ref={modalRef} bgHide={false} keyHide={true} onHide={hideSheet}>
        <TouchableWithoutFeedback onPress={hideSheet}>
          <View style={styles.mask}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <Animated.View
                style={[
                  styles.sheetContainer,
                  { transform: [{ translateY: slideAnim }] },
                ]}
              >
                {/* 顶部拖拽把手 */}
                <View style={styles.dragHandle} />

                {/* 标题栏 */}
                <View style={styles.headerRow}>
                  <View style={styles.headerTitleWrap}>
                    <Icon name="slider" size={17} color={colors.ink} />
                    <Text style={styles.headerTitle}>切换音乐源</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    activeOpacity={0.7}
                    onPress={hideSheet}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="close" size={12} color={colors.inkSecondary} />
                  </TouchableOpacity>
                </View>

                {/* 说明小提示 */}
                <View style={styles.tipBar}>
                  <Icon name="help" size={13} color={colors.inkSecondary} />
                  <Text style={styles.tipText} numberOfLines={1}>
                    内容由 5 家平台提供，曲库互不相通，切换将刷新当前列表
                  </Text>
                </View>

                {/* 单列音源平台列表 */}
                <ScrollView
                  style={{ maxHeight: 300 }}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  <View style={styles.listWrap}>
                    {sourceList_t.map((item) => {
                      const isActive = item.action === source
                      const meta = SOURCE_META[item.action] ?? { char: item.label.slice(1, 2), color: colors.brand }
                      return (
                        <TouchableOpacity
                          key={item.action}
                          style={[
                            styles.sourceRow,
                            isActive ? styles.sourceRowActive : styles.sourceRowInactive,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => handleSelectSource(item.action as S[number])}
                        >
                          <View style={[styles.sourceAvatar, { backgroundColor: meta.color }]}>
                            <Text style={styles.sourceAvatarText}>{meta.char}</Text>
                          </View>
                          <View style={styles.rowTextWrap}>
                            <Text style={styles.rowLabel} numberOfLines={1}>
                              {item.label}
                            </Text>
                            <Text style={styles.rowDesc} numberOfLines={1}>
                              {t(`source_desc_${item.action}`)}
                            </Text>
                          </View>
                          {isActive && (
                            <View style={styles.checkBadge}>
                              <Icon name="check" size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  )
}

export default forwardRef(Component) as <S extends Sources>(
  p: SourceSelectorProps<S> & { ref?: Ref<SourceSelectorType<S>> }
) => JSX.Element | null
