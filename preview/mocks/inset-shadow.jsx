// react-native-inset-shadow stub：透传 children 的普通 View
import React from 'react'
import { View } from 'react-native'

export default function InsetShadow({ children, style, ...rest }) {
  return <View style={style} {...rest}>{children}</View>
}
