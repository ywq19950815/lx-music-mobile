// react-native-file-system stub
import pako from 'pako'
import { Buffer } from 'buffer'

export const Dirs = {
  DocumentDir: '/docs',
  CacheDir: '/cache',
  MainBundleDir: '/bundle',
}
export const FileSystem = {
  async exists() { return false },
  async readDir() { return [] },
  async ls() { return [] },
  async readFile() { return '' },
  async appendFile() {},
  async writeFile() {},
  async unlink() {},
  async mkdir() {},
  async cp() {},
  async mv() {},
  async rename() {},
  async stat() { return { size: 0, mtime: new Date() } },
  async hash() { return '00000000000000000000000000000000' },
  async gzipFile() {},
  async unGzipFile() {},
  async gzipString(data) {
    return Buffer.from(pako.gzipSync(Buffer.from(String(data), 'utf8'))).toString('base64')
  },
  async unGzipString(data) {
    return Buffer.from(pako.ungzip(Buffer.from(String(data), 'base64'))).toString('utf8')
  },
}
export const AndroidScoped = {}
export const Encoding = { UTF8: 'utf8', Base64: 'base64', ASCII: 'ascii' }
export const OpenDocumentOptions = {}
export const HashAlgorithm = { MD5: 'MD5', SHA1: 'SHA-1', SHA256: 'SHA-256' }
export function getExternalStoragePaths() { return Promise.resolve([]) }
