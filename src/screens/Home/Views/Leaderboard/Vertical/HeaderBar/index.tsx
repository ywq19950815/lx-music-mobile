import { forwardRef, useImperativeHandle, useRef } from 'react'
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native'
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
  onGoSearch?: () => void
  onSubTabPress?: (index: number) => void
}

export interface HeaderBarType {
  setBound: (source: LX.OnlineSource, id: string, name: string) => void
}

// 音乐馆子导航 Tab（「官方榜单」为当前内容，其余入口敬请期待）
const SUB_TABS = ['官方榜单', '分类流派', '新碟首发', '数字专区', '顶级厂牌'] as const

/**
 * 音乐馆页头（2026-09-29 设计稿）：
 * - 画廊态：大标题「音乐馆」+ 副标题 + 搜索/榜单筛选圆钮 + 子导航 Tab 行
 * - 详情态：返回「大盘」+ 当前榜单名 + 音源选择器
 */
export default forwardRef<HeaderBarType, HeaderBarProps>(({ onShowBound, onSourceChange, isDetailView, onBackToGallery, onGoSearch, onSubTabPress }, ref) => {
  const activeListNameRef = useRef<ActiveListNameType>(null)
  const sourceSelectorRef = useRef<SourceSelectorType>(null)

  useImperativeHandle(ref, () => ({
    setBound(source, id, name) {
      sourceSelectorRef.current?.setSource(source)
      activeListNameRef.current?.setBound(id, name)
    },
  }), [])

  if (isDetailView) {
    // ── 单榜单详情态 ──────────────────────────
    return (
      <View style={styles.headerBar}>
        <View style={styles.detailLeftGroup}>
          {onBackToGallery ? (
            <TouchableOpacity style={styles.backBtn} onPress={onBackToGallery} activeOpacity={0.7}>
              <Icon name="chevron-left" size={15} color={colors.ink} />
              <Text style={styles.backBtnText}>大盘</Text>
            </TouchableOpacity>
          ) : null}
          <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} />
        </View>
        <ActiveListName ref={activeListNameRef} onShowBound={onShowBound} />
      </View>
    )
  }

  // ── 音乐馆画廊态 ──────────────────────────
  return (
    <View style={styles.galleryHeader}>
      <View style={styles.titleRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>音乐馆</Text>
          <Text style={styles.subtitle}>发现全球先锋音乐与权威榜单</Text>
        </View>
        <View style={styles.titleActions}>
          <TouchableOpacity
            style={styles.circleBtn}
            activeOpacity={0.7}
            onPress={() => { onGoSearch?.() }}
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

      {/* 子导航 Tab 行 + 音源切换 */}
      <View style={styles.subTabRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabScroll} contentContainerStyle={styles.subTabContent}>
          {SUB_TABS.map((tab, idx) => (
            <TouchableOpacity
              key={tab}
              style={styles.subTabItem}
              activeOpacity={0.7}
              onPress={() => { onSubTabPress?.(idx) }}
            >
              <Text style={[styles.subTabText, idx === 0 && styles.subTabTextActive]}>{tab}</Text>
              {idx === 0 ? <View style={styles.subTabIndicator} /> : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.sourceWrap}>
          <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} />
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
    zIndex: 2,
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
  subTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    marginTop: 6,
  },
  subTabScroll: {
    flex: 1,
    minWidth: 0,
  },
  subTabContent: {
    gap: 22,
    paddingRight: 8,
  },
  subTabItem: {
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  subTabText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: colors.inkTertiary,
  },
  subTabTextActive: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.brand,
  },
  subTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.brand,
  },
  sourceWrap: {
    flexShrink: 0,
    paddingLeft: 4,
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
