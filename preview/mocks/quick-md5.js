import cryptoJs from 'crypto-js'

export function stringMd5(str) {
  return cryptoJs.MD5(str).toString()
}
export function hash(str) {
  return cryptoJs.MD5(str).toString()
}
