import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const r = (p) => path.resolve(__dirname, p)

// 原生模块 → 统一 stub
const nativeStubs = {
  'react-native-track-player': r('./mocks/track-player.js'),
  'react-native-background-timer': r('./mocks/background-timer.js'),
  '@react-native-async-storage/async-storage': r('./mocks/async-storage.js'),
  'react-native-vector-icons': r('./mocks/icons.jsx'),
  'react-native-fast-image': r('./mocks/fast-image.jsx'),
  '@react-native-community/slider': r('./mocks/slider.jsx'),
  'react-native-pager-view': r('./mocks/pager-view.jsx'),
  'react-native-fs': r('./mocks/generic-stub.js'),
  'react-native-file-system': r('./mocks/file-system.js'),
  'react-native-local-media-metadata': r('./mocks/generic-stub.js'),
  'react-native-quick-base64': r('./mocks/quick-base64.js'),
  'react-native-quick-md5': r('./mocks/quick-md5.js'),
  'react-native-inset-shadow': r('./mocks/inset-shadow.jsx'),
  'react-native-extra-dimensions-android': r('./mocks/extra-dimensions.js'),
  'react-native-exception-handler': r('./mocks/exception-handler.js'),
  '@react-native-clipboard/clipboard': r('./mocks/clipboard.js'),
}

const sourceStubs = [
  // CJS/UMD vendor 源文件在浏览器无法运行，指向 stub（注意必须全匹配替换，
  // 否则相对前缀 './vendors/' 会被保留拼出无效路径）
  { find: /^\.\/vendors\/infSign\.min(\.js)?$/, replacement: r('./mocks/inf-sign.js') },
  { find: /^infSign\.min(\.js)?$/, replacement: r('./mocks/inf-sign.js') },
]

export default defineConfig({
  plugins: [
    {
      name: 'stub-vendor-cjs',
      enforce: 'pre',
      resolveId(source) {
        if (source.includes('infSign')) console.log('[stub-plugin] hit:', source)
        if (/(^|\/)infSign\.min(\.js)?$/.test(source)) return r('./mocks/inf-sign.js')
        return null
      },
      // 源码里的个别 CJS require → ESM import
      transform(code, id) {
        if (id.includes('musicSdk/kw/decodeLyric.js') && code.includes("require('pako')")) {
          return code.replace("const { inflate } = require('pako')", "import { inflate } from 'pako'")
        }
        // 运行时资源 require（图片等）→ 提升为 ESM import
        if (!id.replace(/\\/g, '/').includes('/src/') || !code.includes('require(')) return null
        const assetRe = /require\('([^']+?\.(?:png|jpe?g|gif|webp))'\)/g
        if (!assetRe.test(code)) return null
        const found = []
        const replaced = code.replace(assetRe, (_m, p1) => {
          const key = '__vite_asset_' + found.length
          found.push([key, p1])
          return key
        })
        const imports = found.map(([key, p1]) => `import ${key} from '${p1}'`).join('\n')
        return imports + '\n' + replaced
      },
    },
    react(),
  ],
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: r('./mocks/rn.js') },
      { find: 'react-native-navigation', replacement: r('./mocks/rnn.jsx') },
      ...Object.entries(nativeStubs).map(([find, replacement]) => ({ find: new RegExp(`^${find.replace(/[/.]/g, '\\$&')}$`), replacement })),
      ...sourceStubs,
      // RN 原生侧资源目录（预览环境不存在）→ 占位图
      { find: /^assets\//, replacement: r('./mocks/img-placeholder.js') },
      { find: /^@renderer\//, replacement: r('../src/renderer') + '/' },
      { find: /^@common\//, replacement: r('../src/common') + '/' },
      { find: /^@\//, replacement: r('../src') + '/' },
    ],
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  server: {
    host: '127.0.0.1',
    port: 5178,
    strictPort: true,
    fs: {
      allow: [r('..')],
    },
  },
})

console.log('[vite-config] loaded, aliases:', 3 + Object.keys(nativeStubs).length)
