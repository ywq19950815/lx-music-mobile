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

export interface ListItemProps {
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
  isMultiSelectMode?: boolean
}

export default memo(({
  item,
  index,
  activeIndex,
  onPress,
  onShowMenu,
  onLongPress,
  selectedList,
  rowInfo,
  isShowAlbumName,
  isShowInterval,
  isMultiSelectMode = false,
}: ListItemProps) => {
  const isSelected = selectedList.includes(item)
  const isSupported = useAssertApiSupport(item.source)
  const moreButtonRef = useRef<TouchableOpacity>(null)

  const handleShowMenu = (event?: any) => {
    const el = moreButtonRef.current as any
    // Web 环境优先使用 getBoundingClientRect 获取精准相对容器坐标
    if (el?.getBoundingClientRect) {
      const rect = el.getBoundingClientRect()
      const doc = (globalThis as any).document
      const rootEl = doc ? (doc.getElementById('phone') || doc.getElementById('root') || doc.body) : null
      const rootRect = rootEl?.getBoundingClientRect?.() || { left: 0, top: 0 }
      const posX = Math.max(0, Math.ceil(rect.left - rootRect.left))
      const posY = Math.max(0, Math.ceil(rect.top - rootRect.top))
      onShowMenu(item, index, {
        x: posX,
        y: posY,
        w: Math.ceil(rect.width || 32),
        h: Math.ceil(rect.height || 32),
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
          onShowMenu(item, index, { x: Math.ceil(pageX - 120), y: Math.ceil(pageY), w: 32, h: 32 })
        }
      })
      return
    }
    // 终极保底
    const pageX = event?.nativeEvent?.pageX ?? 300
    const pageY = event?.nativeEvent?.pageY ?? 200
    onShowMenu(item, index, { x: Math.ceil(pageX - 120), y: Math.ceil(pageY), w: 32, h: 32 })
  }

  const active = activeIndex === index
  const singer = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`

  return (
    <View
      style={[
        styles.container,
        {
          width: rowInfo.rowWidth,
          opacity: isSupported ? 1 : 0.45,
        },
      ]}
    >
      <View
        style={[
          styles.row,
          active && styles.rowActive,
          isSelected && styles.rowSelected,
        ]}
      >
        <TouchableOpacity
          style={styles.contentLeft}
          onPress={() => onPress(item, index)}
          onLongPress={() => onLongPress(item, index)}
          activeOpacity={0.65}
        >
          {/* 左侧序号 / 播放指示 / 多选勾选框 */}
          <View style={styles.leadingCol}>
            {isMultiSelectMode ? (
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected ? (
                  <Icon name="check" size={12} color="#FFFFFF" />
                ) : null}
              </View>
            ) : active ? (
              <View style={styles.playingBadge}>
                <Icon name="play" size={10} color="#FFFFFF" />
              </View>
            ) : (
              <Text style={styles.indexText}>{index + 1}</Text>
            )}
          </View>

          {/* 歌名与歌手元数据 */}
          <View style={styles.infoCol}>
            <Text
              style={[styles.title, active && styles.titleActive]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={styles.metaRow}>
              {/* 来源小药丸标签 */}
              <View style={[styles.sourceTag, active && styles.sourceTagActive]}>
                <Text style={[styles.sourceText, active && styles.sourceTextActive]}>
                  {item.source.toUpperCase()}
                </Text>
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

        {/* 右侧更多操作按钮 */}
        <TouchableOpacity
          ref={moreButtonRef}
          onPress={handleShowMenu}
          style={styles.moreBtn}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="dots-vertical" color="#94A3B8" size={16} />
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
    prevProps.isMultiSelectMode === nextProps.isMultiSelectMode &&
    prevProps.activeIndex !== nextProps.index &&
    nextProps.activeIndex !== nextProps.index &&
    nextProps.selectedList.includes(nextProps.item) === prevProps.selectedList.includes(nextProps.item)
  )
})

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  // 正在播放激活态：QQ音乐标准品牌绿微透背景
  rowActive: {
    backgroundColor: 'rgba(49, 194, 124, 0.08)',
  },
  rowSelected: {
    backgroundColor: 'rgba(49, 194, 124, 0.12)',
  },
  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  // 左侧指示区：宽度固定 30dp，居中
  leadingCol: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  indexText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  playingBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 19,
  },
  titleActive: {
    fontWeight: '700',
    color: colors.brand,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  sourceTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  sourceTagActive: {
    backgroundColor: 'rgba(49, 194, 124, 0.15)',
  },
  sourceText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  sourceTextActive: {
    color: colors.brand,
  },
  singerText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
  },
  intervalText: {
    fontSize: 11,
    color: '#94A3B8',
    marginRight: 8,
  },
  moreBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
})
