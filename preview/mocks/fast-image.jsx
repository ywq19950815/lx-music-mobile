// react-native-fast-image → RNW Image（url 属性映射）
import React from 'react'
import { Image as RNImage } from 'react-native'

const FastImage = ({ url, source, resizeMode, style, onError, ...rest }) => {
  const src = url ?? (typeof source === 'object' ? source?.uri : source)
  return <RNImage source={src ? { uri: src } : undefined} resizeMode={resizeMap[resizeMode] ?? 'cover'} style={style} onError={onError} {...rest} />
}

const resizeMap = { contain: 'contain', cover: 'cover', stretch: 'stretch', 'cover': 'cover' }

export default FastImage
