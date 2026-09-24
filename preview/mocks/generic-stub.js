// 通用原生模块 stub：任意方法调用返回 resolved Promise / 空对象
const handler = {
  get(_t, prop) {
    if (prop === 'then') return undefined // 避免 thenable 误判
    if (prop === 'addListener') return () => ({ remove: () => {} })
    if (prop === 'addEventListener') return () => ({ remove: () => {} })
    return (...args) => Promise.resolve()
  },
}
const universalStub = new Proxy({}, handler)
export default universalStub
export const readPic = () => Promise.resolve(null)
export const _readPic = () => Promise.resolve(null)
export const readMetadata = () => Promise.resolve(null)
export const writeMetadata = () => Promise.resolve()
export const writePic = () => Promise.resolve()
export const readLyric = () => Promise.resolve(null)
export const writeLyric = () => Promise.resolve()
export const getExternalStoragePaths = () => Promise.resolve([])
export const RNFS = new Proxy({}, {
  get(_t, prop) {
    if (prop === 'FSInfo') return () => Promise.resolve({ totalSpace: 0, freeSpace: 0 })
    return (...args) => Promise.resolve('')
  },
})
