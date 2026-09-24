import { memo, useRef } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import Badge, { type BadgeType } from '@/components/common/Badge'
import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import { useI18n } from '@/lang'
import { scaleSizeH } from '@/utils/pixelRatio'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
import { type RowInfo } from '@/utils/tools'
import { colors } from '@/theme/tokens'

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT + 6)

const useQualityTag = (musicInfo: LX.Music.MusicInfoOnline) => {
  const t = useI18n()
  let info: { type: BadgeType | null, text: string } = { type: null, text: '' }
  if (musicInfo.meta._qualitys.flac24bit) {
    info.type = 'secondary'
    info.text = t('quality_lossless_24bit')
  } else if (musicInfo.meta._qualitys.flac ?? musicInfo.meta._qualitys.ape) {
    info.type = 'secondary'
    info.text = t('quality_lossless')
  } else if (musicInfo.meta._qualitys['320k']) {
    info.type = 'tertiary'
    info.text = t('quality_high_quality')
  }

  return info
}

export default memo(({ item, index, showSource, onPress, onLongPress, onShowMenu, selectedList, rowInfo, isShowAlbumName, isShowInterval }: {
  item: LX.Music.MusicInfoOnline
  index: number
  showSource?: boolean
  onPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onLongPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfoOnline, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedList: LX.Music.MusicInfoOnline[]
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
}) => {
  const isSelected = selectedList.includes(item)

  const moreButtonRef = useRef<TouchableOpacity>(null)
  const handleShowMenu = (event?: any) => {
    const el = moreButtonRef.current as any
    if (el?.getBoundingClientRect) {
      const rect = el.getBoundingClientRect()
      const rootEl = (typeof document !== 'undefined') ? (document.getElementById('phone') || document.getElementById('root') || document.body) : null
      const rootRect = rootEl?.getBoundingClientRect?.() || { left: 0, top: 0 }
      const posX = Math.max(0, Math.ceil(rect.left - rootRect.left))
      const posY = Math.max(0, Math.ceil(rect.top - rootRect.top))
      onShowMenu(item, index, {
        x: posX,
        y: posY,
        w: Math.ceil(rect.width || 28),
        h: Math.ceil(rect.height || 28),
      })
      return
    }
    if (el?.measure) {
      el.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
        if (px !== undefined && !isNaN(px)) {
          onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
        } else {
          const pageX = event?.nativeEvent?.pageX ?? 300
          const pageY = event?.nativeEvent?.pageY ?? 200
          onShowMenu(item, index, { x: Math.ceil(pageX - 120), y: Math.ceil(pageY), w: 28, h: 28 })
        }
      })
      return
    }
    const pageX = event?.nativeEvent?.pageX ?? 300
    const pageY = event?.nativeEvent?.pageY ?? 200
    onShowMenu(item, index, { x: Math.ceil(pageX - 120), y: Math.ceil(pageY), w: 28, h: 28 })
  }
  const tagInfo = useQualityTag(item)

  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  return (
    <View style={[
      styles.cardWrapper,
      { width: rowInfo.rowWidth, height: ITEM_HEIGHT },
    ]}>
      {/* 现代柔和列表单行卡片 */}
      <View style={[
        styles.cardFront,
        isSelected && styles.cardSelected,
      ]}>
        <TouchableOpacity
          style={styles.listItemLeft}
          activeOpacity={0.7}
          onPress={() => { onPress(item, index) }}
          onLongPress={() => { onLongPress(item, index) }}
        >
          {/* 精致序号徽章 */}
          <View style={[
            styles.snBox,
            index === 0 && styles.snGold,
            index === 1 && styles.snSoftGold,
            index === 2 && styles.snGray,
          ]}>
            <Text
              style={[styles.snText, index < 3 && styles.topSnText]}
              size={11}
              color={index === 0 ? '#FFFFFF' : (index === 1 ? '#B36B00' : colors.inkSecondary)}
            >
              {index + 1}
            </Text>
          </View>

          {/* 圆角封面 */}
          <View style={styles.coverWrapper}>
            <Image
              url={item.meta.picUrl}
              style={styles.cover}
              resizeMode="cover"
            />
          </View>

          <View style={styles.itemInfo}>
            <Text numberOfLines={1} style={styles.musicTitle} color={colors.ink}>
              {item.name}
            </Text>
            <View style={styles.listItemSingle}>
              { tagInfo.type ? <Badge type={tagInfo.type}>{tagInfo.text}</Badge> : null }
              { showSource ? <Badge type="tertiary">{item.source}</Badge> : null }
              <Text style={styles.singerText} size={11} color={colors.inkSecondary} numberOfLines={1}>
                {singer}
              </Text>
            </View>
          </View>

          {
            isShowInterval ? (
              <Text size={11} style={styles.intervalText} color={colors.inkTertiary} numberOfLines={1}>
                {item.interval}
              </Text>
            ) : null
          }
        </TouchableOpacity>

        {/* 更多菜单按钮 */}
        <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={styles.moreButton} activeOpacity={0.7}>
          <Icon name="dots-vertical" size={15} color={colors.inkSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    nextProps.selectedList.includes(nextProps.item) == prevProps.selectedList.includes(nextProps.item)
  )
})

const styles = StyleSheet.create({
  cardWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardFront: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingRight: 8,
    paddingLeft: 8,
    shadowColor: '#171A1F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardSelected: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
  },
  listItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  snBox: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    borderRadius: 5,
  },
  snGold: {
    backgroundColor: '#F5A623',
  },
  snSoftGold: {
    backgroundColor: 'rgba(245, 166, 35, 0.18)',
  },
  snGray: {
    backgroundColor: '#F3F4F6',
  },
  snText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  topSnText: {
    fontWeight: '700',
  },
  coverWrapper: {
    width: 38,
    height: 38,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 6,
  },
  musicTitle: {
    fontWeight: '600',
    fontSize: 13.5,
  },
  listItemSingle: {
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  singerText: {
    fontWeight: '400',
  },
  intervalText: {
    fontWeight: '500',
    marginRight: 6,
  },
  moreButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
