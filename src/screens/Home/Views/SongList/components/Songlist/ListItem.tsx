import { memo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { type ListInfoItem } from '@/store/songlist/state'
import Text from '@/components/common/Text'
import { scaleSizeW } from '@/utils/pixelRatio'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import Image from '@/components/common/Image'
import { colors } from '@/theme/tokens'

// 卡片左右单侧外边距（两张卡片之间的间距为 gap * 2）
const gap = scaleSizeW(6)

/**
 * 歌单封面卡片：现代柔和微阴影设计。
 */
export default memo(({ item, index, showSource, onPress }: {
  item: ListInfoItem
  index: number
  showSource: boolean
  onPress: (item: ListInfoItem, index: number) => void
}) => {
  const handlePress = () => {
    onPress(item, index)
  }

  return item.source ? (
    <View style={styles.listItem}>
      {/* 封面区域：圆角微浮雕阴影 */}
      <View style={styles.coverWrapper}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePress}
          style={styles.coverFront}
        >
          <Image
            url={item.img}
            nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_from_${item.id}`}
            style={styles.cover}
          />

          {/* 来源微角标：半透沉浸胶囊 */}
          {showSource ? (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText} size={9}>
                {item.source.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* 歌单标题 */}
      <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={styles.titleWrap}>
        <Text style={styles.listItemTitle} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.listItem} />
  )
})

const styles = StyleSheet.create({
  listItem: {
    flex: 1,
    flexBasis: 0,
    marginHorizontal: gap,
    marginVertical: 6,
  },
  coverWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  coverFront: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    shadowColor: '#171A1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
  },
  sourceBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sourceText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  titleWrap: {
    marginTop: 2,
  },
  listItemTitle: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.ink,
  },
})
