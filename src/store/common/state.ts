import { type NAV_ID_Type, type COMPONENT_IDS } from '@/config/constant'


export interface InitState {
  fontSize: number
  statusbarHeight: number
  /** 底部导航栏 / 手势条（小白条）高度，沉浸式下需要给底部菜单栏留出的安全间距 */
  navigationBarHeight: number
  componentIds: Partial<Record<COMPONENT_IDS, string>>
  navActiveId: NAV_ID_Type
  lastNavActiveId: NAV_ID_Type
  sourceNames: Record<LX.OnlineSource | 'all', string>
}

const initData = {}

const state: InitState = {
  fontSize: global.lx.fontSize,
  statusbarHeight: 0,
  navigationBarHeight: 0,
  componentIds: {},
  navActiveId: 'nav_search',
  lastNavActiveId: 'nav_search',
  sourceNames: initData as InitState['sourceNames'],
}


export default state
