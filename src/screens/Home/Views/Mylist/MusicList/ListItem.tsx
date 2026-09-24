import { memo, useRef } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
import { Icon } from '@/components/common/Icon'
import { type RowInfo } from '@/utils/tools'
import { useAssertApiSupport } from '@/store/common/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import Text from '@/components/common/Text'
import { colors } from '@/theme/tokens'

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT) + 4

export default memo(({ item, index, activeIndex, onPress, onShowMenu, onLongPress, selectedList, rowInfo, isShowAlbumName, isShowInterval }: {
  item: LX.Music.MusicInfo
  index: number
  activeIndex: number
  onPress: (item: LX.Music.MusicInfo, index: number) => void
  onLongPress: (item: LX.Music.MusicInfo, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedList: LX.Music.MusicInfo[]
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
}) => {
  const isSelected = selectedList.includes(item)
  const isSupported = useAssertApiSupport(item.source)
  const moreButtonRef = useRef<TouchableOpacity>(null)

  const handleShowMenu = (event?: any) => {
    console.log('--- [ListItem] handleShowMenu called for:', item.name)
    const el = moreButtonRef.current as any
    // Web 环境优先使用 getBoundingClientRect 获取精准相对容器坐标
    if (el?.getBoundingClientRect) {
      const rect = el.getBoundingClientRect()
      const rootEl = (typeof document !== 'undefined') ? (document.getElementById('phone') || document.getElementById('root') || document.body) : null
      const rootRect = rootEl?.getBoundingClientRect?.() || { left: 0, top: 0 }
      const posX = Math.max(0, Math.ceil(rect.left - rootRect.left))
      const posY = Math.max(0, Math.ceil(rect.top - rootRect.top))
      console.log('--- [ListItem] Calculated pos relative to phone:', posX, posY)
      onShowMenu(item, index, {
        x: posX,
        y: posY,
        w: Math.ceil(rect.width || 28),
        h: Math.ceil(rect.height || 28),
      })
      return
    }
    // 原生移动端使用 measure
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
    // 终极保底
    const pageX = event?.nativeEvent?.pageX ?? 300
    const pageY = event?.nativeEvent?.pageY ?? 200
    onShowMenu(item, index, { x: Math.ceil(pageX - 120), y: Math.ceil(pageY), w: 28, h: 28 })
  }

  const active = activeIndex === index
  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  return (
    <View
      style={[
        styles.container,
        {
          width: rowInfo.rowWidth,
          opacity: isSupported ? 1 : 0.5,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          active && styles.cardActive,
          isSelected && styles.cardSelected,
        ]}
      >
        <TouchableOpacity
          style={styles.contentLeft}
          onPress={() => onPress(item, index)}
          onLongPress={() => onLongPress(item, index)}
          activeOpacity={0.7}
        >
          {/* 精致序号徽章 */}
          <View style={[styles.indexBadge, active && styles.indexBadgeActive]}>
            {active ? (
              <Icon name="play" size={11} color="#FFFFFF" />
            ) : (
              <Text style={styles.indexText}>{index + 1}</Text>
            )}
          </View>

          {/* 歌名与歌手信息 */}
          <View style={styles.infoCol}>
            <Text style={[styles.title, active && styles.titleActive]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.metaRow}>
              {/* 来源标签 */}
              <View style={styles.sourceTag}>
                <Text style={styles.sourceText}>{item.source.toUpperCase()}</Text>
              </View>
              <Text style={styles.singerText} numberOfLines={1}>
                {singer}
              </Text>
            </View>
          </View>

          {/* 时长 */}
          {isShowInterval ? (
            <Text style={styles.intervalText} numberOfLines={1}>
              {item.interval}
            </Text>
          ) : null}
        </TouchableOpacity>

        {/* 右侧更多操作按键 */}
        <TouchableOpacity
          ref={moreButtonRef}
          onPress={handleShowMenu}
          style={styles.moreBtn}
          activeOpacity={0.6}
        >
          <Icon name="dots-vertical" color={colors.inkSecondary} size={15} />
        </TouchableOpacity>
      </View>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(
    prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    prevProps.activeIndex !== nextProps.index &&
    nextProps.activeIndex !== nextProps.index &&
    nextProps.selectedList.includes(nextProps.item) === prevProps.selectedList.includes(nextProps.item)
  )
})

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#171A1F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  // 正在播放激活态：浅金微透背景 + 金细边
  cardActive: {
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.35)',
  },
  cardSelected: {
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
  },
  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // 序号徽章
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  indexBadgeActive: {
    backgroundColor: '#F5A623',
  },
  indexText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.ink,
  },
  titleActive: {
    fontWeight: '700',
    color: '#B36B00',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  sourceTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
  },
  sourceText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.inkTertiary,
  },
  singerText: {
    fontSize: 11.5,
    fontWeight: '400',
    color: colors.inkSecondary,
    flexShrink: 1,
  },
  intervalText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.inkTertiary,
    marginRight: 8,
  },
  moreBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
})
