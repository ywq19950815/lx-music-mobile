import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import ButtonBar from './ActionBar'
import { useNavigationComponentDidAppear, pop } from '@/navigation'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Image from '@/components/common/Image'
import { useListInfo } from './state'
import { useStatusbarHeight } from '@/store/common/hook'
import { neoColors } from '@/theme/neobrutalism'

const cleanHtmlText = (str?: string): string => {
  if (!str) return ''
  return str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/<[^>]+>/g, '')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
}

const formatPlayCount = (num: string | number) => {
  if (!num) return ''
  const n = typeof num === 'string' ? parseInt(num, 10) : num
  if (isNaN(n)) return String(num)
  if (n > 100000000) return `${(n / 100000000).toFixed(1)}亿`
  if (n > 10000) return `${(n / 10000).toFixed(1)}万`
  return String(n)
}

const Pic = ({ componentId, playCount, imgUrl }: {
  componentId: string
  playCount: string
  imgUrl?: string
}) => {
  const [pic, setPic] = useState(imgUrl)
  const [animated, setAnimated] = useState(false)
  const info = useListInfo()
  useEffect(() => {
    if (animated) setPic(imgUrl)
  }, [imgUrl, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  const countStr = formatPlayCount(playCount)

  return (
    <View style={styles.coverWrapper}>
      <View style={styles.coverBox}>
        <Image
          nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_to_${info.id}`}
          url={pic}
          style={styles.coverImage}
        />
        {countStr ? (
          <View style={styles.playCountBadge}>
            <Text style={styles.playCountText} numberOfLines={1}>
              ▶ {countStr}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

export interface HeaderProps {
  componentId: string
}

export interface HeaderType {
  setInfo: (info: DetailInfo) => void
}
export interface DetailInfo {
  name: string
  desc: string
  playCount: string
  imgUrl?: string
}

export default forwardRef<HeaderType, HeaderProps>(({ componentId }: { componentId: string }, ref) => {
  const statusBarHeight = useStatusbarHeight()
  const info = useListInfo()
  const [detailInfo, setDetailInfo] = useState<DetailInfo>({
    name: info.name || '',
    desc: cleanHtmlText(info.desc),
    playCount: (info as any).play_count || '',
    imgUrl: info.img,
  })

  useImperativeHandle(ref, () => ({
    setInfo(newInfo) {
      setDetailInfo({
        ...newInfo,
        desc: cleanHtmlText(newInfo.desc),
      })
    },
  }), [])

  const handleBack = () => {
    void pop(commonState.componentIds.songlistDetail || componentId)
  }

  const cleanedDesc = useMemo(() => {
    return cleanHtmlText(detailInfo.desc)
  }, [detailInfo.desc])

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight }]}>
      {/* 顶部新粗野主义导航栏 */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={handleBack}
        >
          <Icon name="chevron-left" size={17} color={neoColors.black} />
        </TouchableOpacity>

        <View style={styles.navTitleBadge}>
          <Text style={styles.navTitleText}>💿 歌单详情</Text>
        </View>

        <View style={styles.sourceBadge}>
          <Text style={styles.sourceBadgeText}>{info.source?.toUpperCase() || 'NET'}</Text>
        </View>
      </View>

      {/* 歌单主卡片：波普黑边白底硬阴影卡片 */}
      <View style={styles.cardContainer}>
        {/* 硬阴影底座 */}
        <View style={styles.cardShadow} />
        {/* 卡片实体 */}
        <View style={styles.cardFront}>
          <View style={styles.infoRow}>
            <Pic componentId={componentId} playCount={detailInfo.playCount} imgUrl={detailInfo.imgUrl} />
            <View style={styles.infoCol} nativeID={NAV_SHEAR_NATIVE_IDS.songlistDetail_title}>
              <Text style={styles.titleText} numberOfLines={2}>
                {detailInfo.name || '歌单'}
              </Text>
              {cleanedDesc ? (
                <Text style={styles.descText} numberOfLines={3}>
                  {cleanedDesc}
                </Text>
              ) : null}
            </View>
          </View>
          {/* 底部操作按钮 */}
          <ButtonBar />
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '100%',
    backgroundColor: neoColors.offWhite,
  },
  navBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: neoColors.white,
    borderWidth: 2,
    borderColor: neoColors.black,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: neoColors.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  navTitleBadge: {
    backgroundColor: neoColors.yellow,
    borderWidth: 1.8,
    borderColor: neoColors.black,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: neoColors.black,
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  navTitleText: {
    fontSize: 13,
    fontWeight: '900',
    color: neoColors.black,
  },
  sourceBadge: {
    backgroundColor: neoColors.cyan,
    borderWidth: 1.8,
    borderColor: neoColors.black,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: neoColors.black,
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: neoColors.black,
  },
  cardContainer: {
    marginHorizontal: 12,
    marginBottom: 8,
    position: 'relative',
  },
  cardShadow: {
    position: 'absolute',
    left: 4,
    top: 4,
    right: -4,
    bottom: -4,
    backgroundColor: neoColors.black,
    borderRadius: 14,
  },
  cardFront: {
    backgroundColor: neoColors.white,
    borderWidth: 2.5,
    borderColor: neoColors.black,
    borderRadius: 14,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  coverWrapper: {
    width: 86,
    height: 86,
    marginRight: 12,
  },
  coverBox: {
    width: 86,
    height: 86,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: neoColors.black,
    backgroundColor: '#F0EFEA',
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  playCountBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  playCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: neoColors.yellow,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 86,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '900',
    color: neoColors.black,
    lineHeight: 20,
    marginBottom: 4,
  },
  descText: {
    fontSize: 11.5,
    color: '#4A4A4A',
    lineHeight: 16,
    fontWeight: '500',
  },
})
