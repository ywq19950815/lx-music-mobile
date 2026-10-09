import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'

import SourceSelector, {
  type SourceSelectorType,
} from './SourceSelector'
import ActiveListName, { type ActiveListNameType } from './ActiveListName'
import { colors, radius } from '@/theme/tokens'

export interface HeaderBarProps {
  onShowBound: () => void
  onSourceChange: (source: LX.OnlineSource) => void
  isDetailView?: boolean
  onBackToGallery?: () => void
  onGoSearch?: (rect: { x: number, y: number, width: number, height: number }) => void
  source?: LX.OnlineSource
}

export interface HeaderBarType {
  setBound: (source: LX.OnlineSource, id: string, name: string) => void
}

/**
 * 排行榜页头：
 * - 画廊态：大标题「排行榜」+ 副标题 + 音源切换胶囊 + 搜索/抽屉筛选圆钮（纯粹排行榜，无虚设分类）
 * - 详情态：返回「排行榜」+ 当前榜单名 + 音源选择器
 */
export default forwardRef<HeaderBarType, HeaderBarProps>(({ onShowBound, onSourceChange, isDetailView, onBackToGallery, onGoSearch, source: propSource }, ref) => {
  const activeListNameRef = useRef<ActiveListNameType>(null)
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const searchBtnRef = useRef<TouchableOpacity>(null)
  const [currentSource, setCurrentSource] = useState<LX.OnlineSource>(propSource ?? 'kw')

  useImperativeHandle(ref, () => ({
    setBound(source, id, name) {
      setCurrentSource(source)
      sourceSelectorRef.current?.setSource(source)
      activeListNameRef.current?.setBound(id, name)
    },
  }), [])

  const handleSourceChange = (newSource: LX.OnlineSource) => {
    setCurrentSource(newSource)
    onSourceChange(newSource)
  }

  if (isDetailView) {
    // ── 单榜单详情态 ──────────────────────────
    return (
      <View style={styles.headerBar}>
        <View style={styles.detailLeftGroup}>
          {onBackToGallery ? (
            <TouchableOpacity style={styles.backBtn} onPress={onBackToGallery} activeOpacity={0.7}>
              <Icon name="chevron-left" size={15} color={colors.ink} />
              <Text style={styles.backBtnText}>排行榜</Text>
            </TouchableOpacity>
          ) : null}
          <SourceSelector ref={sourceSelectorRef} source={currentSource} onSourceChange={handleSourceChange} />
        </View>
        <ActiveListName ref={activeListNameRef} onShowBound={onShowBound} />
      </View>
    )
  }

  // ── 排行榜画廊态 ──────────────────────────
  return (
    <View style={styles.galleryHeader}>
      <View style={styles.titleRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>排行榜</Text>
          <Text style={styles.subtitle}>官方权威榜单 · 实时潮流风向标</Text>
        </View>
        <View style={styles.titleActions}>
          <SourceSelector ref={sourceSelectorRef} source={currentSource} onSourceChange={handleSourceChange} />
          <TouchableOpacity
            ref={searchBtnRef}
            style={styles.circleBtn}
            activeOpacity={0.7}
            onPress={() => {
              searchBtnRef.current?.measureInWindow((x, y, width, height) => {
                onGoSearch?.({ x, y, width, height })
              })
            }}
          >
            <Icon name="search-2" size={16} color={colors.brand} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.circleBtn}
            activeOpacity={0.7}
            onPress={onShowBound}
            testID="btn-leaderboard-change-board"
          >
            <Icon name="slider" size={16} color={colors.brand} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  // ── 画廊态 ───────────────────────────────
  galleryHeader: {
    backgroundColor: colors.canvas,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    zIndex: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 11.5,
    color: colors.inkSecondary,
    marginTop: 3,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── 详情态 ───────────────────────────────
  headerBar: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    zIndex: 2,
  },
  detailLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#F3F4F6',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
})
