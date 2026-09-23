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
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

type Sources = Readonly<Array<LX.OnlineSource | 'all'>>

export interface SourceSelectorProps<S extends Sources> {
  fontSize?: number
  center?: boolean
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
    borderWidth: 2,
    borderColor: neoColors.black,
    borderRadius: 8,
    backgroundColor: neoColors.yellow,
    ...neoShadows.sm,
  },
  sourceMenuText: {
    fontWeight: '900',
    color: neoColors.black,
    textAlign: 'center',
  },
  arrowIcon: {
    fontSize: 11,
    fontWeight: '900',
    color: neoColors.black,
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
    backgroundColor: '#F8F6EE',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomWidth: 0,
    borderColor: neoColors.black,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '75%',
    shadowColor: neoColors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 20,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: neoColors.black,
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
    fontSize: 15,
    fontWeight: '900',
    color: neoColors.black,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: neoColors.white,
    borderWidth: 2,
    borderColor: neoColors.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...neoShadows.sm,
  },
  // 提示条
  tipBar: {
    backgroundColor: neoColors.white,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipText: {
    fontSize: 11.5,
    color: neoColors.gray700,
    fontWeight: '600',
    flex: 1,
  },
  // 2 列卡片网格
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  sourceCard: {
    width: '48.3%',
    height: 54,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: neoColors.black,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...neoShadows.sm,
  },
  sourceCardActive: {
    backgroundColor: neoColors.yellow,
    shadowOffset: { width: 1, height: 1 },
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
  sourceCardInactive: {
    backgroundColor: neoColors.white,
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: neoColors.black,
  },
  indicatorDotActive: {
    backgroundColor: neoColors.black,
  },
  indicatorDotInactive: {
    backgroundColor: 'transparent',
  },
  sourceLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: neoColors.black,
    flexShrink: 1,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
  },
})

const Component = <S extends Sources>(
  { fontSize = 13, center, onSourceChange }: SourceSelectorProps<S>,
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
        style={styles.sourceMenu}
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
                    <Icon name="slider" size={17} color={neoColors.black} />
                    <Text style={styles.headerTitle}>切换音乐源</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    activeOpacity={0.7}
                    onPress={hideSheet}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="close" size={12} color={neoColors.black} />
                  </TouchableOpacity>
                </View>

                {/* 说明小提示 */}
                <View style={styles.tipBar}>
                  <Icon name="help" size={13} color={neoColors.gray700} />
                  <Text style={styles.tipText} numberOfLines={1}>
                    不同音源拥有不同版权曲库，切换将刷新当前列表
                  </Text>
                </View>

                {/* 2 列音源波普大卡片列表 */}
                <ScrollView
                  style={{ maxHeight: 280 }}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  <View style={styles.gridWrap}>
                    {sourceList_t.map((item) => {
                      const isActive = item.action === source
                      return (
                        <TouchableOpacity
                          key={item.action}
                          style={[
                            styles.sourceCard,
                            isActive ? styles.sourceCardActive : styles.sourceCardInactive,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => handleSelectSource(item.action as S[number])}
                        >
                          <View style={styles.sourceLeft}>
                            <View
                              style={[
                                styles.indicatorDot,
                                isActive ? styles.indicatorDotActive : styles.indicatorDotInactive,
                              ]}
                            />
                            <Text style={styles.sourceLabel} numberOfLines={1}>
                              {item.label}
                            </Text>
                          </View>
                          {isActive && (
                            <View style={styles.activeBadge}>
                              <Text style={styles.activeBadgeText}>当前</Text>
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
