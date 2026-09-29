import { toOldMusicInfo } from '@/utils'
import music from '@/utils/musicSdk'

export interface Comment {
  id: string
  text: string
  images?: string[]
  location?: string
  timeStr?: string
  /**
   * 评论时间戳。各音源单位不一（秒/毫秒），过滤时统一归一化。
   */
  time?: number
  userName: string
  avatar?: string
  userId?: string
  likedCount?: number
  replyNum?: number
  reply: Comment[]
}
export interface CommentInfo {
  source: LX.OnlineSource
  comments: Comment[]
  total: number
  page: number
  limit: number
  maxPage: number
}

export const getNewComment = async(musicInfo: LX.Music.MusicInfoOnline, page: number, limit: number, retryNum = 0): Promise<CommentInfo> => {
  let resp
  try {
    resp = await (music[musicInfo.source].comment.getComment(toOldMusicInfo(musicInfo), page, limit) as Promise<CommentInfo>)
  } catch (error: any) {
    console.log(error.message)
    if (error.message == '取消请求' || ++retryNum > 2) throw error
    resp = await getNewComment(musicInfo, page, limit, retryNum)
  }
  return resp
}

export const getHotComment = async(musicInfo: LX.Music.MusicInfoOnline, page: number, limit: number, retryNum = 0): Promise<CommentInfo> => {
  let resp
  try {
    resp = await (music[musicInfo.source].comment.getHotComment(toOldMusicInfo(musicInfo), page, limit) as Promise<CommentInfo>)
  } catch (error: any) {
    console.log(error.message)
    if (error.message == '取消请求' || ++retryNum > 2) throw error
    resp = await getHotComment(musicInfo, page, limit, retryNum)
  }
  return resp
}

/**
 * 近一年时间窗：评论列表只展示最近一年的评论（热门/最新计数同步按此口径）。
 * 无时间信息的评论不误杀，正常展示。
 */
const YEAR_MS = 365 * 24 * 60 * 60 * 1000

// 各音源时间单位不一（秒/毫秒），统一归一化为毫秒
const toMs = (time: unknown): number => {
  const n = Number(time)
  if (!n || Number.isNaN(n)) return 0
  return n < 1e12 ? n * 1000 : n
}

export const filterList = (list: Comment[]) => {
  const set = new Set()
  const minTime = Date.now() - YEAR_MS
  return list.filter(c => {
    let id = String(c.id)
    if (set.has(id)) return false
    if (c.time && toMs(c.time) < minTime) return false
    set.add(id)
    return true
  })
}
