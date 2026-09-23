import { memo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { type ListInfoItem } from '@/store/songlist/state'
import Text from '@/components/common/Text'
import { scaleSizeW } from '@/utils/pixelRatio'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import Image from '@/components/common/Image'
import { neoColors, neoBorders } from '@/theme/neobrutalism'

// 卡片左右单侧外边距（两张卡片之间的间距为 gap * 2）
const gap = scaleSizeW(6)

/**
 * NeoSongListCard: 新粗野主义歌单封面卡片。
 * - 纯黑 2px 描边
 * - 纯黑实体硬投影 (Hard Offset Shadow)
 * - 电光粉波普来源小贴纸
 * - 超粗黑体标题
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
      {/* 封面区域：纯黑厚边框 + 硬阴影 */}
      <View style={styles.coverWrapper}>
        <View style={styles.coverShadow} />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePress}
          style={styles.coverFront}
        >
          <Image
            url={item.img}
            nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_from_${item.id}`}
            style={styles.cover}
          />

          {/* 波普漫画风来源贴纸 */}
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
    // 末尾补位用的空卡片：同样由 flex 占满 1/n 宽度，保证最后一行的真实卡片不会被拉宽
    <View style={styles.listItem} />
  )
})

const styles = StyleSheet.create({
  listItem: {
    // 由 row 容器（columnWrapperStyle）按 flex 均分宽度，
    // 不再手算像素宽度：手算宽度依赖容器 padding 的层数，RNW 下会叠加出错导致横向溢出被裁切
    flex: 1,
    // RN 的 flexBasis 默认为 0%，配合 flexGrow: 1 才能真正按「均分」而非「内容宽度 + 均分」
    flexBasis: 0,
    marginHorizontal: gap,
    marginVertical: 6,
  },
  coverWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  // 封面：宽度跟随卡片（100%），用 aspectRatio 保证正方形，避免再次引入像素宽度计算
  cover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
  },
  // 纯黑硬投影底座
  coverShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    backgroundColor: neoColors.black,
    borderRadius: 12,
    zIndex: 0,
  },
  coverFront: {
    position: 'relative',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: neoColors.black,
    overflow: 'hidden',
    backgroundColor: neoColors.gray100,
    zIndex: 1,
  },
  // 波普小贴纸标签
  sourceBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: neoColors.pink,
    borderWidth: 1.5,
    borderColor: neoColors.black,
  },
  sourceText: {
    color: neoColors.black,
    fontWeight: '900',
  },
  titleWrap: {
    marginTop: 2,
  },
  listItemTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: neoColors.black,
    letterSpacing: -0.2,
  },
})
