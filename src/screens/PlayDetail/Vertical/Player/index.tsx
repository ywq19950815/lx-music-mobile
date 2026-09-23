import { memo } from 'react'
import { View } from 'react-native'

// import Title from './components/Title'
import MoreBtn from './components/MoreBtn'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { neoColors } from '@/theme/neobrutalism'
import { useNavigationBarHeight } from '@/store/common/hook'

const BASE_PADDING_BOTTOM = 12

export default memo(() => {
  // 沉浸式下这一层直接贴到屏幕底部，必须让出底部手势条（小白条）的高度
  const navigationBarHeight = useNavigationBarHeight()

  return (
    <View
      style={[styles.container, { paddingBottom: BASE_PADDING_BOTTOM + navigationBarHeight }]}
      nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}
    >
      <PlayInfo />
      <ControlBtn />
      <MoreBtn />
    </View>
  )
})

const styles = createStyle({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    paddingHorizontal: 15,
    paddingTop: 8,
    backgroundColor: neoColors.offWhite,
    borderTopWidth: 2,
    borderTopColor: neoColors.black,
    flexDirection: 'column',
    zIndex: 30,
  },
  status: {
    marginTop: 10,
    flexDirection: 'column',
    flex: 0,
    paddingLeft: 5,
    justifyContent: 'space-evenly',
  },
})
