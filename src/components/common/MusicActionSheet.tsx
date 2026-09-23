import React, { useRef, useImperativeHandle, forwardRef, useState, useCallback, useMemo, useEffect } from 'react'
import {
  View,
  TouchableOpacity,
  TouchableHighlight,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native'
import Modal, { type ModalType } from '@/components/common/Modal'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { neoColors, neoBorders, neoShadows } from '@/theme/neobrutalism'
import { hasDislike } from '@/core/dislikeList'
import { hasMusicUrlByMusic } from '@/utils/data'
import { existsFile } from '@/utils/fs'

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
  onCopyName?: (selectInfo: any) => void
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

const styles = StyleSheet.create({
  mask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#F8F6EE', // 新粗野主义温暖底色
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomWidth: 0,
    borderColor: neoColors.black,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '85%',
    // 物理实体硬阴影
    shadowColor: neoColors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 20,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: neoColors.black,
    alignSelf: 'center',
    marginBottom: 12,
  },
  // 当前操作歌曲微缩信息卡片
  musicCard: {
    backgroundColor: neoColors.white,
    borderWidth: 2,
    borderColor: neoColors.black,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    ...neoShadows.sm,
  },
  musicCoverDisc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: neoColors.black,
    borderWidth: 2,
    borderColor: neoColors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  musicCoverInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: neoColors.yellow,
    borderWidth: 1.5,
    borderColor: neoColors.black,
  },
  musicInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  musicTitle: {
    fontWeight: '800',
    color: neoColors.black,
    marginBottom: 3,
  },
  musicSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  singerText: {
    color: neoColors.gray600,
    fontWeight: '600',
    flexShrink: 1,
  },
  qualityBadge: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  qualityBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2E7D32',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: neoColors.white,
    borderWidth: 2,
    borderColor: neoColors.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...neoShadows.sm,
  },
  // 4 格高频波普大按键
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  quickActionBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: neoColors.black,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...neoShadows.sm,
  },
  quickActionIconWrap: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: neoColors.black,
    textAlign: 'center',
  },
  // 次频管理列表卡片
  actionListCard: {
    backgroundColor: neoColors.white,
    borderWidth: 2,
    borderColor: neoColors.black,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    ...neoShadows.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F0EFEA',
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
    fontWeight: '700',
    color: neoColors.black,
  },
  actionArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: neoColors.gray500,
    marginLeft: 6,
  },
  // 危险移除区
  dangerBtn: {
    backgroundColor: '#FFF1F1',
    borderWidth: 2,
    borderColor: neoColors.black,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...neoShadows.sm,
  },
  dangerText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#D85A30',
  },
  dangerTag: {
    backgroundColor: '#FFE5E5',
    borderColor: '#D85A30',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dangerTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D85A30',
  },
})

export default forwardRef<MusicActionSheetType, MusicActionSheetProps>((props, ref) => {
  const t = useI18n()
  const modalRef = useRef<ModalType>(null)
  const [visible, setVisible] = useState(false)
  const [selectInfo, setSelectInfo] = useState<MusicActionSheetSelectInfo | null>(null)
  const [hasEditMeta, setHasEditMeta] = useState(false)
  const [hasCache, setHasCache] = useState(false)

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
      modalRef.current?.setVisible(false)
      props.onHide?.()
    })
  }, [props, slideAnim])

  useImperativeHandle(ref, () => ({
    show(info) {
      console.log('--- [MusicActionSheet] show called for:', info?.musicInfo?.name, 'hasModalRef:', !!modalRef.current)
      setSelectInfo(info)
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
                    <Icon name="close" size={12} color={neoColors.black} />
                  </TouchableOpacity>
                </View>
              )}

              {/* 第一层：4 格波普高频大按键 */}
              <View style={styles.quickActionsGrid}>
                {/* 1. 立即播放 */}
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: neoColors.yellow }]}
                  activeOpacity={0.8}
                  onPress={() => handleAction(props.onPlay)}
                >
                  <View style={styles.quickActionIconWrap}>
                    <Icon name="play" size={16} color={neoColors.black} />
                  </View>
                  <Text style={styles.quickActionLabel}>{t('play')}</Text>
                </TouchableOpacity>

                {/* 2. 稍后播放 */}
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: neoColors.white }]}
                  activeOpacity={0.8}
                  onPress={() => handleAction(props.onPlayLater)}
                >
                  <View style={styles.quickActionIconWrap}>
                    <Icon name="play-outline" size={16} color={neoColors.black} />
                  </View>
                  <Text style={styles.quickActionLabel}>{t('play_later')}</Text>
                </TouchableOpacity>

                {/* 3. 歌曲换源 / 复制名称 */}
                {props.onToggleSource && !isLocal ? (
                  <TouchableOpacity
                    style={[styles.quickActionBtn, { backgroundColor: '#FF66B2' }]}
                    activeOpacity={0.8}
                    onPress={() => handleAction(props.onToggleSource)}
                  >
                    <View style={styles.quickActionIconWrap}>
                      <Icon name="slider" size={15} color={neoColors.black} />
                    </View>
                    <Text style={styles.quickActionLabel}>{t('toggle_source')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.quickActionBtn, { backgroundColor: '#E1F5EE' }]}
                    activeOpacity={0.8}
                    onPress={() => handleAction(props.onCopyName)}
                  >
                    <View style={styles.quickActionIconWrap}>
                      <Icon name="share" size={15} color={neoColors.black} />
                    </View>
                    <Text style={styles.quickActionLabel}>{t('copy_name')}</Text>
                  </TouchableOpacity>
                )}

                {/* 4. 添加到... */}
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#AFA9EC' }]}
                  activeOpacity={0.8}
                  onPress={() => handleAction(props.onAdd)}
                >
                  <View style={styles.quickActionIconWrap}>
                    <Icon name="add-music" size={16} color={neoColors.black} />
                  </View>
                  <Text style={styles.quickActionLabel}>{t('add_to')}</Text>
                </TouchableOpacity>
              </View>

              {/* 第二层：次频与管理功能分组列表 */}
              <ScrollView
                style={{ maxHeight: 240 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={styles.actionListCard}>
                  {/* 移动到... (仅本地列表支持) */}
                  {props.onMove && (
                    <TouchableHighlight
                      style={styles.actionRow}
                      underlayColor={neoColors.yellow}
                      onPress={() => handleAction(props.onMove)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                        <View style={styles.actionIconBox}>
                          <Icon name="add_folder" size={17} color={neoColors.black} />
                        </View>
                        <Text style={styles.actionRowText}>{t('move_to')}</Text>
                        <Text style={styles.actionArrow}>›</Text>
                      </View>
                    </TouchableHighlight>
                  )}

                  {/* 复制歌曲与歌手名 */}
                  {props.onCopyName && props.onToggleSource && !isLocal && (
                    <TouchableHighlight
                      style={styles.actionRow}
                      underlayColor={neoColors.yellow}
                      onPress={() => handleAction(props.onCopyName)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                        <View style={styles.actionIconBox}>
                          <Icon name="share" size={16} color={neoColors.black} />
                        </View>
                        <Text style={styles.actionRowText}>{t('copy_name')}</Text>
                        <Text style={styles.actionArrow}>›</Text>
                      </View>
                    </TouchableHighlight>
                  )}

                  {/* 歌曲详情页 */}
                  {props.onMusicSourceDetail && !isLocal && (
                    <TouchableHighlight
                      style={styles.actionRow}
                      underlayColor={neoColors.yellow}
                      onPress={() => handleAction(props.onMusicSourceDetail)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                        <View style={styles.actionIconBox}>
                          <Icon name="album" size={16} color={neoColors.black} />
                        </View>
                        <Text style={styles.actionRowText}>{t('music_source_detail')}</Text>
                        <Text style={styles.actionArrow}>›</Text>
                      </View>
                    </TouchableHighlight>
                  )}

                  {/* 调整位置 (仅本地列表支持) */}
                  {props.onChangePosition && (
                    <TouchableHighlight
                      style={styles.actionRow}
                      underlayColor={neoColors.yellow}
                      onPress={() => handleAction(props.onChangePosition)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                        <View style={styles.actionIconBox}>
                          <Icon name="music_time" size={16} color={neoColors.black} />
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
                      underlayColor={neoColors.yellow}
                      disabled={!hasEditMeta}
                      onPress={() => handleAction(props.onEditMetadata)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                        <View style={styles.actionIconBox}>
                          <Icon name="setting" size={16} color={neoColors.black} />
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
                      underlayColor={neoColors.yellow}
                      disabled={!hasCache}
                      onPress={() => handleAction(props.onRemoveCache)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                        <View style={styles.actionIconBox}>
                          <Icon name="eraser" size={16} color={neoColors.black} />
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
                      underlayColor={neoColors.yellow}
                      disabled={isDisliked}
                      onPress={() => handleAction(props.onDislikeMusic)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                        <View style={styles.actionIconBox}>
                          <Icon name="thumbs-up" size={16} color={neoColors.black} />
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
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
})
