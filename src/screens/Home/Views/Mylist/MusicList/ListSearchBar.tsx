import { useState, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { Animated, View, TouchableOpacity, StyleSheet } from 'react-native'

import Text from '@/components/common/Text'
import Input, { type InputType } from '@/components/common/Input'
import { Icon } from '@/components/common/Icon'

import { useI18n } from '@/lang'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

interface SearchInputProps {
  onSearch: (keywork: string) => void
  placeholder: string
}
type SearchInputType = InputType

const SearchInput = forwardRef<SearchInputType, SearchInputProps>(({ onSearch, placeholder }, ref) => {
  const [text, setText] = useState('')

  const handleChangeText = (text: string) => {
    setText(text)
    onSearch(text.trim())
  }

  return (
    <Input
      onChangeText={handleChangeText}
      placeholder={placeholder}
      value={text}
      style={styles.input}
      clearBtn
      ref={ref}
    />
  )
})


export interface ListSearchBarProps {
  onSearch: (keywork: string) => void
  onExitSearch: () => void
}
export interface ListSearchBarType {
  show: () => void
  hide: () => void
}

/**
 * NeoListSearchBar: 新粗野主义风格的歌单搜索条。
 * - 复古浅黄底纸顶栏 + 2.5px 纯黑底边
 * - 白色胶囊输入框（1.5px 黑描边）+ 放大镜图标
 * - 取消按钮为亮黄描边小胶囊，带纯黑硬阴影
 * - 父容器已给定高度，浮层不再被裁切成细线
 */
export default forwardRef<ListSearchBarType, ListSearchBarProps>(({ onSearch, onExitSearch }, ref) => {
  const t = useI18n()
  const [visible, setVisible] = useState(false)
  const [animatePlayed, setAnimatPlayed] = useState(true)
  const animFade = useRef(new Animated.Value(0)).current
  const animTranslateY = useRef(new Animated.Value(-20)).current
  const searchInputRef = useRef<SearchInputType>(null)

  useImperativeHandle(ref, () => ({
    show() {
      handleShow()
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
      })
    },
    hide() {
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
    opacity: animFade, // Bind opacity to animated value
    transform: [
      { translateY: animTranslateY },
    ],
  }), [animFade, animTranslateY])

  const component = useMemo(() => {
    return (
      <Animated.View style={animaStyle}>
        <View style={styles.field}>
          <Icon name="search-2" size={15} color={neoColors.black} style={styles.searchIcon} />
          <SearchInput
            ref={searchInputRef}
            onSearch={onSearch}
            placeholder={t('list_search_placeholder')}
          />
        </View>
        <TouchableOpacity onPress={onExitSearch} style={styles.btn} activeOpacity={0.7}>
          <Text style={styles.btnText}>{t('list_select_cancel')}</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }, [animaStyle, onSearch, onExitSearch, t])

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
    paddingLeft: 12,
    // 右侧多留 4px：给「取消」按钮的 2.5px 硬阴影让位，避免被容器裁掉
    paddingRight: 16,
    backgroundColor: neoColors.offWhite,
    borderBottomWidth: neoBorders.regular,
    borderBottomColor: neoColors.black,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    // RNW 下 flex 子项默认 min-width:auto，会被长 placeholder 撑开而溢出
    minWidth: 0,
    height: 34,
    paddingHorizontal: 9,
    backgroundColor: neoColors.white,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusPill,
  },
  searchIcon: {
    marginRight: 4,
    flexGrow: 0,
    flexShrink: 0,
  },
  input: {
    height: 30,
    paddingLeft: 0,
    fontWeight: '700',
  },
  btn: {
    flexGrow: 0,
    flexShrink: 0,
    marginLeft: 10,
    paddingHorizontal: 14,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: neoColors.yellow,
    borderWidth: neoBorders.thin,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusPill,
    // Neo-Brutalism 硬阴影（RN Web 直接透传为 box-shadow）
    boxShadow: '2.5px 2.5px 0px #000000',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '900',
    color: neoColors.black,
  },
})
