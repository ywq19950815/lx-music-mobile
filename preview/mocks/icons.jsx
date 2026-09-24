/**
 * IcoMoon 图标 web mock：读取 selection.json 的 code 映射，
 * 以 icomoon 字体（index.html 已 @font-face 注册）渲染字形。
 */
import React, { memo } from 'react'
import { Text } from 'react-native'
import icoMoonConfig from '../../src/resources/fonts/selection.json'

const glyphMap = {}
for (const icon of icoMoonConfig.icons) {
  const name = (icon.properties?.name || '').split(',')[0].trim()
  if (name) glyphMap[name] = icon.properties.code
}
// icon- 前缀兼容
for (const [k, v] of Object.entries(glyphMap)) {
  if (!k.startsWith('icon-')) glyphMap[`icon-${k}`] = v
}

const fontFamily = icoMoonConfig?.preferences?.fontPref?.metadata?.fontFamily || 'icomoon'

function createIconSetFromIcoMoon() {
  const Icon = memo(({ name, size = 15, color = '#333', style, ...props }) => {
    const code = glyphMap[name]
    if (code == null) return null
    return (
      <Text
        style={[
          {
            fontFamily: 'icomoon',
            fontSize: size,
            color,
            includeFontPadding: false,
            textAlignVertical: 'center',
            lineHeight: size,
          },
          style,
        ]}
        {...props}
      >
        {String.fromCharCode(code)}
      </Text>
    )
  })
  return Icon
}

export { createIconSetFromIcoMoon }
export default { createIconSetFromIcoMoon }
