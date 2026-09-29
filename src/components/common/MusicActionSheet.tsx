import React, { useRef, useImperativeHandle, forwardRef, useState, useCallback, useMemo } from 'react'
import {
  View,
  TouchableOpacity,
  TouchableHighlight,
  StyleSheet,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native'
import Modal, { type ModalType } from '@/components/common/Modal'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { colors, radius } from '@/theme/tokens'
import { hasDislike } from '@/core/dislikeList'
import { hasMusicUrlByMusic } from '@/utils/data'
import { existsFile } from '@/utils/fs'
import { clipboardWriteText, toast } from '@/utils/tools'

export interface MusicActionSheetSelectInfo {
  musicInfo: LX.Music.MusicInfo
  selectedList?: any[]
  index?: number
  listId?: string
  single?: boolean
}

export interface MusicActionSheetProps {
  onPlay?: (selectInfo: any) => void
  onPlayLater?: (selectInfo: any) => void
  onAdd?: (selectInfo: any) => void
  onMove?: (selectInfo: any) => void
  onEditMetadata?: (selectInfo: any) => void
  onChangePosition?: (selectInfo: any) => void
  onToggleSource?: (selectInfo: any) => void
  onMusicSourceDetail?: (selectInfo: any) => void
  onRemoveCache?: (selectInfo: any) => void
  onDislikeMusic?: (selectInfo: any) => void
  onRemove?: (selectInfo: any) => void
  onHide?: () => void
}

export interface MusicActionSheetType {
  show: (selectInfo: MusicActionSheetSelectInfo, position?: any) => void
  hide: () => void
}

const SOURCE_NAMES: Record<string, string> = {
  kw: '酷我音乐',
  kg: '酷狗音乐',
  tx: '企鹅音乐',
  wy: '网易云音乐',
  mg: '咪咕音乐',
  local: '本地音频',
}

const styles = StyleSheet.create({
  mask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: colors.hairline,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E2E7',
    alignSelf: 'center',
    marginBottom: 12,
  },
  // 当前操作歌曲微缩信息卡片
  musicCard: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  musicCoverDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1C20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  musicCoverInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.brand,
  },
  musicInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  musicTitle: {
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 3,
  },
  musicSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  singerText: {
    color: colors.inkSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  qualityBadge: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  qualityBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#B36B00',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ECEEF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 4 格高频大按键
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  quickActionBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  quickActionIconWrap: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  // 次频管理列表卡片
  actionListCard: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  actionRowDisabled: {
    opacity: 0.38,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionIconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionRowText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: colors.ink,
  },
  actionArrow: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.inkTertiary,
    marginLeft: 6,
  },
  // 危险移除区
  dangerBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dangerText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#DC2626',
  },
  dangerTag: {
    backgroundColor: '#FCA5A5',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dangerTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#991B1B',
  },
  // 应用内歌曲详细信息面板
  detailWrap: {
    paddingBottom: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  detailCard: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F2F5',
  },
  detailItemLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    width: 76,
    fontSize: 13,
    color: '#8A92A0',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#2C3038',
    fontWeight: '600',
  },
  detailBtnGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  detailCopyBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCopyBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  detailBackBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBackBtnText: {
    color: colors.ink,
    fontSize: 13.5,
    fontWeight: '600',
  },
})

export default forwardRef<MusicActionSheetType, MusicActionSheetProps>((props, ref) => {
  const t = useI18n()
  const modalRef = useRef<ModalType>(null)
  const [visible, setVisible] = useState(false)
  const [selectInfo, setSelectInfo] = useState<MusicActionSheetSelectInfo | null>(null)
  const [hasEditMeta, setHasEditMeta] = useState(false)
  const [hasCache, setHasCache] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  // 底部抽屉滑行动画
  const slideAnim = useRef(new Animated.Value(300)).current

  const hide = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setVisible(false)
      setShowDetail(false)
      modalRef.current?.setVisible(false)
      props.onHide?.()
    })
  }, [props, slideAnim])

  useImperativeHandle(ref, () => ({
    show(info) {
      setSelectInfo(info)
      setShowDetail(false)
      setVisible(true)
      modalRef.current?.setVisible(true)

      // 异步检测元数据与缓存状态
      const musicInfo = info?.musicInfo
      if (musicInfo) {
        if (musicInfo.source === 'local') {
          void existsFile(musicInfo.meta?.filePath).then(setHasEditMeta)
        } else {
          setHasEditMeta(false)
        }
        void hasMusicUrlByMusic(musicInfo).then(setHasCache)
      }

      // 入场动画
      slideAnim.setValue(300)
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    },
    hide,
  }))

  const handleAction = useCallback((callback?: (info: any) => void) => {
    if (!callback || !selectInfo) return
    hide()
    // 稍作微小延迟以确保抽屉退场流畅，不引起重绘卡顿
    setTimeout(() => {
      callback(selectInfo)
    }, 60)
  }, [selectInfo, hide])

  const handleCopyMusicInfo = useCallback(() => {
    if (!selectInfo?.musicInfo) return
    const m = selectInfo.musicInfo
    const sourceName = SOURCE_NAMES[m.source] || m.source
    const text = `《${m.name}》 - ${m.singer || '未知歌手'}${m.meta?.albumName ? ` (专辑: ${m.meta.albumName})` : ''} [来源: ${sourceName}]`
    clipboardWriteText(text)
    toast('歌曲信息已复制到剪贴板')
  }, [selectInfo])

  const musicInfo = selectInfo?.musicInfo
  const isLocal = musicInfo?.source === 'local'
  const isDisliked = musicInfo ? hasDislike(musicInfo) : false

  // 音质标签判定
  const quality = useMemo(() => {
    if (!musicInfo?.meta?.qualitys) return 'SQ'
    const qs = musicInfo.meta.qualitys
    if (qs.includes('flac24bit') || qs.includes('flac')) return 'SQ无损'
    if (qs.includes('320k')) return 'HQ高品'
    return '标准'
  }, [musicInfo])

  return (
    <Modal ref={modalRef} bgHide={false} keyHide={true} onHide={hide}>
      <TouchableWithoutFeedback onPress={hide}>
        <View style={styles.mask}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.sheetContainer,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* 顶部防滑拖拽把手 */}
              <View style={styles.dragHandle} />

              {/* 模式 A：应用内歌曲详细信息面板 */}
              {showDetail && musicInfo ? (
                <View style={styles.detailWrap}>
                  <View style={styles.detailHeader}>
                    <Text style={styles.detailTitle}>歌曲详细信息</Text>
                    <TouchableOpacity
                      style={styles.closeBtn}
                      activeOpacity={0.7}
                      onPress={hide}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="close" size={12} color={colors.inkSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailCard}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>歌曲名称</Text>
                      <Text style={styles.detailValue} numberOfLines={2}>{musicInfo.name}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>演唱歌手</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>{musicInfo.singer || '未知歌手'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>所属专辑</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>{musicInfo.meta?.albumName || '单曲或未知专辑'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>音源平台</Text>
                      <Text style={styles.detailValue}>{SOURCE_NAMES[musicInfo.source] || musicInfo.source}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>音质规格</Text>
                      <Text style={[styles.detailValue, { color: colors.brand }]}>{quality}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>歌曲时长</Text>
                      <Text style={styles.detailValue}>{musicInfo.interval || '--:--'}</Text>
                    </View>
                    <View style={[styles.detailItem, styles.detailItemLast]}>
                      <Text style={styles.detailLabel}>歌曲标识</Text>
                      <Text style={[styles.detailValue, { fontSize: 11, color: '#6B7280' }]} numberOfLines={1}>{musicInfo.id}</Text>
                    </View>
                  </View>

                  <View style={styles.detailBtnGroup}>
                    <TouchableOpacity
                      style={styles.detailCopyBtn}
                      activeOpacity={0.8}
                      onPress={handleCopyMusicInfo}
                    >
                      <Text style={styles.detailCopyBtnText}>复制歌曲信息</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailBackBtn}
                      activeOpacity={0.8}
                      onPress={() => setShowDetail(false)}
                    >
                      <Text style={styles.detailBackBtnText}>返回操作列表</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* 模式 B：常规操作列表（完全禁止内部滚动，自适应高度） */
                <View>
                  {/* 当前操作歌曲预览卡片 */}
                  {musicInfo && (
                    <View style={styles.musicCard}>
                      <View style={styles.musicCoverDisc}>
                        <View style={styles.musicCoverInner} />
                      </View>
                      <View style={styles.musicInfoCol}>
                        <Text style={styles.musicTitle} size={14.5} numberOfLines={1}>
                          {musicInfo.name}
                        </Text>
                        <View style={styles.musicSubRow}>
                          <Text style={styles.singerText} size={12} numberOfLines={1}>
                            {musicInfo.singer || t('unknown')}
                            {musicInfo.meta?.albumName ? ` · ${musicInfo.meta.albumName}` : ''}
                          </Text>
                          <View style={styles.qualityBadge}>
                            <Text style={styles.qualityBadgeText}>{quality}</Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.closeBtn}
                        activeOpacity={0.7}
                        onPress={hide}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="close" size={12} color={colors.inkSecondary} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* 第一层：4 格高频大按键 */}
                  <View style={styles.quickActionsGrid}>
                    {/* 1. 立即播放 */}
                    <TouchableOpacity
                      style={[styles.quickActionBtn, { backgroundColor: colors.brand }]}
                      activeOpacity={0.8}
                      onPress={() => handleAction(props.onPlay)}
                    >
                      <View style={styles.quickActionIconWrap}>
                        <Icon name="play" size={16} color="#FFFFFF" />
                      </View>
                      <Text style={[styles.quickActionLabel, { color: '#FFFFFF' }]}>{t('play')}</Text>
                    </TouchableOpacity>

                    {/* 2. 稍后播放：采用 list-order 队列清单图标，彻底与三角播放区分 */}
                    <TouchableOpacity
                      style={styles.quickActionBtn}
                      activeOpacity={0.8}
                      onPress={() => handleAction(props.onPlayLater)}
                    >
                      <View style={styles.quickActionIconWrap}>
                        <Icon name="list-order" size={16} color={colors.inkSecondary} />
                      </View>
                      <Text style={styles.quickActionLabel}>{t('play_later')}</Text>
                    </TouchableOpacity>

                    {/* 3. 歌曲换源 */}
                    {props.onToggleSource && !isLocal ? (
                      <TouchableOpacity
                        style={styles.quickActionBtn}
                        activeOpacity={0.8}
                        onPress={() => handleAction(props.onToggleSource)}
                      >
                        <View style={styles.quickActionIconWrap}>
                          <Icon name="slider" size={15} color={colors.inkSecondary} />
                        </View>
                        <Text style={styles.quickActionLabel}>{t('toggle_source')}</Text>
                      </TouchableOpacity>
                    ) : null}

                    {/* 4. 添加到... */}
                    <TouchableOpacity
                      style={styles.quickActionBtn}
                      activeOpacity={0.8}
                      onPress={() => handleAction(props.onAdd)}
                    >
                      <View style={styles.quickActionIconWrap}>
                        <Icon name="add-music" size={16} color={colors.inkSecondary} />
                      </View>
                      <Text style={styles.quickActionLabel}>{t('add_to')}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 第二层：次频与管理功能分组列表（禁止滚动，自适应展现） */}
                  <View style={styles.actionListCard}>
                    {/* 移动到... (仅本地列表支持) */}
                    {props.onMove && (
                      <TouchableHighlight
                        style={styles.actionRow}
                        underlayColor="rgba(0,0,0,0.04)"
                        onPress={() => handleAction(props.onMove)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                          <View style={styles.actionIconBox}>
                            <Icon name="add_folder" size={17} color={colors.inkSecondary} />
                          </View>
                          <Text style={styles.actionRowText}>{t('move_to')}</Text>
                          <Text style={styles.actionArrow}>›</Text>
                        </View>
                      </TouchableHighlight>
                    )}

                    {/* 歌曲详情页：应用内查看详情，坚决不跳出到外部浏览器 */}
                    {!isLocal && (
                      <TouchableHighlight
                        style={styles.actionRow}
                        underlayColor="rgba(0,0,0,0.04)"
                        onPress={() => setShowDetail(true)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                          <View style={styles.actionIconBox}>
                            <Icon name="album" size={16} color={colors.inkSecondary} />
                          </View>
                          <Text style={styles.actionRowText}>歌曲详情</Text>
                          <Text style={styles.actionArrow}>›</Text>
                        </View>
                      </TouchableHighlight>
                    )}

                    {/* 调整位置 (仅本地列表支持) */}
                    {props.onChangePosition && (
                      <TouchableHighlight
                        style={styles.actionRow}
                        underlayColor="rgba(0,0,0,0.04)"
                        onPress={() => handleAction(props.onChangePosition)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                          <View style={styles.actionIconBox}>
                            <Icon name="music_time" size={16} color={colors.inkSecondary} />
                          </View>
                          <Text style={styles.actionRowText}>{t('change_position')}</Text>
                          <Text style={styles.actionArrow}>›</Text>
                        </View>
                      </TouchableHighlight>
                    )}

                    {/* 编辑元数据 (仅本地文件支持) */}
                    {props.onEditMetadata && isLocal && (
                      <TouchableHighlight
                        style={[styles.actionRow, !hasEditMeta && styles.actionRowDisabled]}
                        underlayColor="rgba(0,0,0,0.04)"
                        disabled={!hasEditMeta}
                        onPress={() => handleAction(props.onEditMetadata)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                          <View style={styles.actionIconBox}>
                            <Icon name="setting" size={16} color={colors.inkSecondary} />
                          </View>
                          <Text style={styles.actionRowText}>{t('edit_metadata')}</Text>
                          <Text style={styles.actionArrow}>›</Text>
                        </View>
                      </TouchableHighlight>
                    )}

                    {/* 清理歌曲本地缓存 */}
                    {props.onRemoveCache && (
                      <TouchableHighlight
                        style={[styles.actionRow, !hasCache && styles.actionRowDisabled]}
                        underlayColor="rgba(0,0,0,0.04)"
                        disabled={!hasCache}
                        onPress={() => handleAction(props.onRemoveCache)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                          <View style={styles.actionIconBox}>
                            <Icon name="eraser" size={16} color={colors.inkSecondary} />
                          </View>
                          <Text style={styles.actionRowText}>{t('list_remove_cache')}</Text>
                          <Text style={styles.actionArrow}>›</Text>
                        </View>
                      </TouchableHighlight>
                    )}

                    {/* 不喜欢 */}
                    {props.onDislikeMusic && (
                      <TouchableHighlight
                        style={[styles.actionRow, styles.actionRowLast, isDisliked && styles.actionRowDisabled]}
                        underlayColor="rgba(0,0,0,0.04)"
                        disabled={isDisliked}
                        onPress={() => handleAction(props.onDislikeMusic)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                          <View style={styles.actionIconBox}>
                            <Icon name="thumbs-up" size={16} color={colors.inkSecondary} />
                          </View>
                          <Text style={styles.actionRowText}>{t('dislike')}</Text>
                          <Text style={styles.actionArrow}>›</Text>
                        </View>
                      </TouchableHighlight>
                    )}
                  </View>

                  {/* 危险操作区：从列表中移除 (若支持) */}
                  {props.onRemove && (
                    <TouchableOpacity
                      style={styles.dangerBtn}
                      activeOpacity={0.7}
                      onPress={() => handleAction(props.onRemove)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Icon name="remove" size={15} color="#D85A30" />
                        <Text style={styles.dangerText}>{t('delete')}</Text>
                      </View>
                      <View style={styles.dangerTag}>
                        <Text style={styles.dangerTagText}>移除</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
})
