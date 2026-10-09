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
  source?: LX.OnlineSource
  boardName?: string
}

export interface HeaderBarType {
  setBound: (source: LX.OnlineSource, id: string, name: string) => void
}

/**
 * 排行榜页头：
 * - 画廊态：大标题「排行榜」+ 副标题 + 音源切换胶囊 + 抽屉筛选圆钮（纯粹排行榜，无虚设分类与多余搜索）
 * - 详情态：返回「排行榜」+ 当前榜单名（真实受控回显）+ 音源选择器
 */
export default forwardRef<HeaderBarType, HeaderBarProps>(({ onShowBound, onSourceChange, isDetailView, onBackToGallery, source: propSource, boardName }, ref) => {
  const activeListNameRef = useRef<ActiveListNameType>(null)
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
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
        <ActiveListName ref={activeListNameRef} boardName={boardName} onShowBound={onShowBound} />
      </View>
    )
  }

  // ── 排行榜画廊态（已去掉搜索功能）─────────
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 11,
    color: colors.inkSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  // ── 详情态 ───────────────────────────────
  headerBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    zIndex: 2,
  },
  detailLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingRight: 6,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
})
