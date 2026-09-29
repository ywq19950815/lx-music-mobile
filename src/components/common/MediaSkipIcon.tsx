import React, { memo } from 'react'
import { View, StyleSheet } from 'react-native'

interface MediaSkipIconProps {
  direction: 'prev' | 'next'
  color: string
  size: number
}

/**
 * 标准媒体跳曲图标（上一首 / 下一首）。
 * 采用业界通用的「竖条 + 实心三角」形态：干净、利落、辨识度高，
 * 替代原 IcoMoon 自绘的 prevMusic / nextMusic 图标。
 * - 上一首（prev）：左侧竖条，右侧一个尖朝左的三角形（指向竖条，寓意跳回前一首）
 * - 下一首（next）：左侧一个尖朝右的三角形，右侧竖条（指向右，寓意跳到下一首）
 */
const MediaSkipIcon = ({ direction, color, size }: MediaSkipIconProps) => {
  const isPrev = direction === 'prev'

  // 三角形几何：以 border 技巧绘制实心三角
  const triHeight = size * 0.5
  const triWidth = size * 0.36
  const triStyle = isPrev
    ? {
        width: 0,
        height: 0,
        borderTopWidth: triHeight / 2,
        borderBottomWidth: triHeight / 2,
        borderRightWidth: triWidth,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: color,
      }
    : {
        width: 0,
        height: 0,
        borderTopWidth: triHeight / 2,
        borderBottomWidth: triHeight / 2,
        borderLeftWidth: triWidth,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: color,
      }

  // 竖条几何：圆角矩形，与三角等高
  const barStyle = {
    width: Math.max(2, size * 0.09),
    height: triHeight,
    borderRadius: Math.max(1, size * 0.045),
    backgroundColor: color,
  }

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        {isPrev ? (
          <>
            <View style={barStyle} />
            <View style={[triStyle, { marginLeft: size * 0.04 }]} />
          </>
        ) : (
          <>
            <View style={[triStyle, { marginRight: size * 0.04 }]} />
            <View style={barStyle} />
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default memo(MediaSkipIcon)
