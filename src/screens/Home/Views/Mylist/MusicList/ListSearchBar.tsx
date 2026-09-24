import { useState, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { Animated, View, TouchableOpacity, StyleSheet } from 'react-native'

import Text from '@/components/common/Text'
import Input, { type InputType } from '@/components/common/Input'
import { Icon } from '@/components/common/Icon'

import { useI18n } from '@/lang'
import { colors } from '@/theme/tokens'

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
 * 歌单搜索条：现代沉浸风格。
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
    opacity: animFade,
    transform: [
      { translateY: animTranslateY },
    ],
  }), [animFade, animTranslateY])

  const component = useMemo(() => {
    return (
      <Animated.View style={animaStyle}>
        <View style={styles.field}>
          <Icon name="search-2" size={15} color={colors.inkTertiary} style={styles.searchIcon} />
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
    paddingRight: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEEF1',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    height: 34,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E6E8EC',
    borderRadius: 17,
  },
  searchIcon: {
    marginRight: 4,
    flexGrow: 0,
    flexShrink: 0,
  },
  input: {
    height: 30,
    paddingLeft: 0,
    fontWeight: '500',
    color: colors.ink,
  },
  btn: {
    flexGrow: 0,
    flexShrink: 0,
    marginLeft: 10,
    paddingHorizontal: 14,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
})
