import { useRef, forwardRef, useImperativeHandle } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import Modal, { type ModalType } from './Modal'
import { type Source } from '@/store/songlist/state'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { colors } from '@/theme/tokens'

export interface OpenListType {
  setInfo: (source: Source) => void
}

export default forwardRef<OpenListType, {}>((props, ref) => {
  const t = useI18n()
  const modalRef = useRef<ModalType>(null)
  const songlistInfoRef = useRef<{ source: Source }>({ source: 'kw' })

  useImperativeHandle(ref, () => ({
    setInfo(source) {
      songlistInfoRef.current.source = source
    },
  }))

  const handleOpenSonglist = (id: string) => {
    navigations.pushSonglistDetailScreen(commonState.componentIds.home!, {
      play_count: undefined,
      id,
      author: '',
      name: '',
      img: undefined,
      desc: undefined,
      source: songlistInfoRef.current.source,
    })
  }

  return (
    <>
      <View style={styles.wrapper}>
        <TouchableOpacity
          style={styles.pill}
          onPress={() => modalRef.current?.show(songlistInfoRef.current.source)}
          activeOpacity={0.7}
        >
          <Text style={styles.text} size={11}>
            {t('songlist_open')}
          </Text>
        </TouchableOpacity>
      </View>
      <Modal ref={modalRef} onOpenId={handleOpenSonglist} />
    </>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  text: {
    fontWeight: '600',
    color: colors.ink,
  },
})
