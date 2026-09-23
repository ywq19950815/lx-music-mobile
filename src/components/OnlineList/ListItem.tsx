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
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'

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

  // 波普前三名贴纸背景色
  const topBadgeBg = index === 0 ? neoColors.yellow : (index === 1 ? neoColors.cyan : (index === 2 ? neoColors.pink : neoColors.white))

  return (
    <View style={[
      styles.cardWrapper,
      { width: rowInfo.rowWidth, height: ITEM_HEIGHT },
    ]}>
      {/* 实体硬阴影底座 */}
      <View style={styles.cardShadow} />
      {/* 实体卡片前景 */}
      <View style={[
        styles.cardFront,
        isSelected && styles.cardSelected,
      ]}>
        <TouchableOpacity
          style={styles.listItemLeft}
          activeOpacity={0.8}
          onPress={() => { onPress(item, index) }}
          onLongPress={() => { onLongPress(item, index) }}
        >
          {/* 波普方块序号徽章 */}
          <View style={[
            styles.snBox,
            index < 3 ? [styles.topSnBox, { backgroundColor: topBadgeBg }] : null,
          ]}>
            <Text style={[styles.snText, index < 3 && styles.topSnText]} size={11} color={neoColors.black}>
              {index + 1}
            </Text>
          </View>

          {/* 波普黑边封面 */}
          <View style={styles.coverWrapper}>
            <Image
              url={item.meta.picUrl}
              style={styles.cover}
              resizeMode="cover"
            />
          </View>

          <View style={styles.itemInfo}>
            <Text numberOfLines={1} style={styles.musicTitle} color={neoColors.black}>
              {item.name}
            </Text>
            <View style={styles.listItemSingle}>
              { tagInfo.type ? <Badge type={tagInfo.type}>{tagInfo.text}</Badge> : null }
              { showSource ? <Badge type="tertiary">{item.source}</Badge> : null }
              <Text style={styles.singerText} size={11} color={neoColors.black} numberOfLines={1}>
                {singer}
              </Text>
            </View>
          </View>

          {
            isShowInterval ? (
              <Text size={11} style={styles.intervalText} color={neoColors.black} numberOfLines={1}>
                {item.interval}
              </Text>
            ) : null
          }
        </TouchableOpacity>

        {/* 更多菜单按钮：带黑边的圆形波普按键 */}
        <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={styles.moreButton} activeOpacity={0.7}>
          <Icon name="dots-vertical" size={14} color={neoColors.black} />
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
    position: 'relative',
  },
  cardShadow: {
    position: 'absolute',
    top: 5,
    bottom: 1,
    left: 10,
    right: 6,
    backgroundColor: neoColors.black,
    borderRadius: neoBorders.radiusMd,
  },
  cardFront: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: neoColors.white,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    borderRadius: neoBorders.radiusMd,
    paddingRight: 6,
    paddingLeft: 6,
  },
  cardSelected: {
    backgroundColor: neoColors.yellow,
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
    borderRadius: 4,
  },
  topSnBox: {
    borderWidth: 1.5,
    borderColor: neoColors.black,
    ...neoShadows.sm,
  },
  snText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  topSnText: {
    fontWeight: '900',
  },
  coverWrapper: {
    width: 38,
    height: 38,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    overflow: 'hidden',
    backgroundColor: neoColors.offWhite,
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
    fontWeight: '900',
    fontSize: 13,
  },
  listItemSingle: {
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  singerText: {
    fontWeight: '600',
    opacity: 0.8,
  },
  intervalText: {
    fontWeight: '700',
    marginRight: 6,
    opacity: 0.6,
  },
  moreButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: neoColors.black,
    backgroundColor: neoColors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
    ...neoShadows.sm,
  },
})
