import { useState } from 'react'
import { ScrollView, TouchableOpacity, View, StyleSheet } from 'react-native'

import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useMyList } from '@/store/list/hook'
import ListItem from './ListItem'
import CreateUserList from '../MusicAddModal/CreateUserList'
import { useI18n } from '@/lang'
import { colors } from '@/theme/tokens'

const CreateListButton = () => {
  const [isEdit, setEdit] = useState(false)
  const t = useI18n()

  return (
    <View style={styles.createWrapper}>
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => setEdit(true)}
        activeOpacity={0.7}
      >
        <View style={styles.createIconBox}>
          <Icon name="add_folder" size={18} color={colors.brand} />
        </View>
        <Text style={styles.createText} size={14}>
          {t('list_create')}
        </Text>
      </TouchableOpacity>
      {isEdit ? <CreateUserList isEdit={isEdit} onHide={() => setEdit(false)} /> : null}
    </View>
  )
}

export default ({ listId, onPress }: {
  listId: string
  onPress: (listInfo: LX.List.MyListInfo) => void
}) => {
  const allList = useMyList().filter(l => l.id != listId)

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <CreateListButton />
      {allList.map(info => (
        <ListItem
          key={info.id}
          listInfo={info}
          onPress={onPress}
        />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 380,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  createWrapper: {
    position: 'relative',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  createIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  createText: {
    fontWeight: '600',
    color: colors.brand,
  },
})
