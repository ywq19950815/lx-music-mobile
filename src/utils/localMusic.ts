import { LIST_IDS } from '@/config/constant'
import { getListMusics, saveListMusics } from '@/utils/data'
import { setMusicList, allMusicList } from '@/utils/listManage'
import { scanAudioFiles, readMetadata, type MusicMetadataFull } from '@/utils/localMediaMetadata'
import { formatPlayTime2 } from '@/utils'
import { type FileType } from '@/utils/fs'

export const buildLocalMusicInfoByFilePath = (file: FileType): LX.Music.MusicInfoLocal => {
  const index = file.name.lastIndexOf('.')
  const baseName = index > 0 ? file.name.substring(0, index) : file.name
  let name = baseName
  let singer = '本地音乐'
  if (baseName.includes(' - ')) {
    const parts = baseName.split(' - ')
    singer = parts[0].trim()
    name = parts.slice(1).join(' - ').trim()
  } else if (baseName.includes('-')) {
    const parts = baseName.split('-')
    singer = parts[0].trim()
    name = parts.slice(1).join('-').trim()
  }

  return {
    id: file.path,
    name,
    singer,
    source: 'local',
    interval: null,
    meta: {
      albumName: '',
      filePath: file.path,
      songId: file.path,
      picUrl: '',
      ext: index > 0 ? file.name.substring(index + 1) : 'mp3',
    },
  }
}

export const buildLocalMusicInfo = (filePath: string, metadata: MusicMetadataFull): LX.Music.MusicInfoLocal => {
  const index = filePath.lastIndexOf('.')
  const ext = index > 0 ? filePath.substring(index + 1) : 'mp3'
  return {
    id: filePath,
    name: metadata.name || filePath.split(/\/|\\/).pop()?.replace(/\.[^.]+$/, '') || '未知歌曲',
    singer: metadata.singer || '本地歌手',
    source: 'local',
    interval: formatPlayTime2(metadata.interval),
    meta: {
      albumName: metadata.albumName || '',
      filePath,
      songId: filePath,
      picUrl: '',
      ext: metadata.ext || ext,
    },
  }
}

/**
 * 获取本地/已下载的全部音乐
 */
export const getLocalMusics = async(): Promise<LX.Music.MusicInfoLocal[]> => {
  const list = await getListMusics(LIST_IDS.DOWNLOAD)
  const localList = (list || []).filter(item => item.source === 'local') as LX.Music.MusicInfoLocal[]
  setMusicList(LIST_IDS.DOWNLOAD, localList)
  return localList
}

/**
 * 扫描指定目录并将音频添加至本地音乐库
 */
export const scanAndAddLocalMusics = async(dirPath: string): Promise<{ added: number, total: number }> => {
  const files = await scanAudioFiles(dirPath)
  if (!files.length) return { added: 0, total: 0 }

  const currentList = await getLocalMusics()
  const currentPathSet = new Set(currentList.map(item => item.meta.filePath))

  const newItems: LX.Music.MusicInfoLocal[] = []
  for (const file of files) {
    if (currentPathSet.has(file.path)) continue
    try {
      const meta = await readMetadata(file.path)
      if (meta && (meta.name || meta.singer)) {
        newItems.push(buildLocalMusicInfo(file.path, meta))
      } else {
        newItems.push(buildLocalMusicInfoByFilePath(file))
      }
    } catch {
      newItems.push(buildLocalMusicInfoByFilePath(file))
    }
  }

  if (newItems.length > 0) {
    const updatedList = [...currentList, ...newItems]
    await saveListMusics([{ id: LIST_IDS.DOWNLOAD, musics: updatedList }])
    setMusicList(LIST_IDS.DOWNLOAD, updatedList)
    global.app_event.downloadListUpdate?.()
    global.app_event.myListMusicUpdate?.([LIST_IDS.DOWNLOAD])
  }

  return { added: newItems.length, total: files.length }
}

/**
 * 移除指定的本地音乐
 */
export const removeLocalMusic = async(filePath: string): Promise<void> => {
  const currentList = await getLocalMusics()
  const updatedList = currentList.filter(item => item.meta.filePath !== filePath && item.id !== filePath)
  await saveListMusics([{ id: LIST_IDS.DOWNLOAD, musics: updatedList }])
  setMusicList(LIST_IDS.DOWNLOAD, updatedList)
  global.app_event.downloadListUpdate?.()
  global.app_event.myListMusicUpdate?.([LIST_IDS.DOWNLOAD])
}

/**
 * 清空全部本地音乐
 */
export const clearLocalMusics = async(): Promise<void> => {
  await saveListMusics([{ id: LIST_IDS.DOWNLOAD, musics: [] }])
  setMusicList(LIST_IDS.DOWNLOAD, [] as LX.Music.MusicInfo[])
  global.app_event.downloadListUpdate?.()
  global.app_event.myListMusicUpdate?.([LIST_IDS.DOWNLOAD])
}
