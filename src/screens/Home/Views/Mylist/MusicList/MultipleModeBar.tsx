import { useState, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { Animated, View, TouchableOpacity, StyleSheet } from 'react-native'

import Text from '@/components/common/Text'
import { colors } from '@/theme/tokens'

export type SelectMode = 'single' | 'range'

export interface MultipleModeBarProps {
  onSwitchMode: (mode: SelectMode) => void
  onSelectAll: (isAll: boolean) => void
  onExitSelectMode: () => void
}
export interface MultipleModeBarType {
  show: () => void
  setVisibleBar: (visible: boolean) => void
  setIsSelectAll: (isAll: boolean) => void
  setSwitchMode: (mode: SelectMode) => void
  exitSelectMode: () => void
}

export default forwardRef<MultipleModeBarType, MultipleModeBarProps>(({ onSelectAll, onSwitchMode, onExitSelectMode }, ref) => {
  const [visible, setVisible] = useState(false)
  const [animatePlayed, setAnimatPlayed] = useState(true)
  const animFade = useRef(new Animated.Value(0)).current
  const animTranslateY = useRef(new Animated.Value(-20)).current
  const [selectMode, setSelectMode] = useState<SelectMode>('single')
  const [isSelectAll, setIsSelectAll] = useState(false)
  const [visibleBar, setVisibleBar] = useState(true)

  useImperativeHandle(ref, () => ({
    show() {
      handleShow()
    },
    setVisibleBar(visible) {
      setVisibleBar(visible)
    },
    setIsSelectAll(isAll) {
      setIsSelectAll(isAll)
    },
    setSwitchMode(mode: SelectMode) {
      setSelectMode(mode)
    },
    exitSelectMode() {
      handleHide()
    },
  }))

  const handleShow = useCallback(() => {
    setVisible(true)
    setAnimatPlayed(false)
    requestAnimationFrame(() => {
      animTranslateY.setValue(-20)

      Animated.parallel([
        Animated.timing(animFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimatPlayed(true)
      })
    })
  }, [animFade, animTranslateY])

  const handleHide = useCallback(() => {
    setAnimatPlayed(false)
    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animTranslateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(finished => {
      if (!finished) return
      setVisible(false)
      setAnimatPlayed(true)
    })
  }, [animFade, animTranslateY])

  const animaStyle = useMemo(() => ({
    ...styles.container,
    opacity: animFade,
    transform: [
      { translateY: animTranslateY },
    ],
  }), [animFade, animTranslateY])

  const handleSelectAll = useCallback(() => {
    const selectAll = !isSelectAll
    setIsSelectAll(selectAll)
    onSelectAll(selectAll)
  }, [isSelectAll, onSelectAll])

  const component = useMemo(() => {
    return (
      <Animated.View style={animaStyle}>
        {/* 单选/跨选分段切换胶囊 */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            onPress={() => onSwitchMode('single')}
            style={[styles.segmentBtn, selectMode === 'single' && styles.segmentBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, selectMode === 'single' && styles.segmentTextActive]}>
              {global.i18n.t('list_select_single')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSwitchMode('range')}
            style={[styles.segmentBtn, selectMode === 'range' && styles.segmentBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, selectMode === 'range' && styles.segmentTextActive]}>
              {global.i18n.t('list_select_range')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 右侧操作按钮 */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            onPress={handleSelectAll}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>
              {global.i18n.t(isSelectAll ? 'list_select_unall' : 'list_select_all')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onExitSelectMode}
            style={styles.cancelBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>
              {global.i18n.t('list_select_cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    )
  }, [animaStyle, selectMode, handleSelectAll, isSelectAll, onExitSelectMode, onSwitchMode])

  if (!visibleBar) return null
  return !visible && animatePlayed ? null : component
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 2,
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  segmentBtnActive: {
    backgroundColor: colors.brand,
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
})
