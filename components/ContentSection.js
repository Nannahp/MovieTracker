// components/ContentSection.js
import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Dimensions } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import ActionButtonItem from 'react-native-vector-icons/Ionicons';
import ContentItem from './ContentItem';

const { width, height } = Dimensions.get('window');

const ContentSection = ({
  title,
  data,
  orderAsc,
  checkedItems,
  collectionName,
  onToggleSort,
  onRemoveShow
}) => {
  const renderContentItem = ({ item }) => (
    <ContentItem
      item={item}
      checkedItems={checkedItems}
      collectionName={collectionName}
      onRemoveShow={onRemoveShow}
    />
  );

  return (
    <View style={styles.section}>
      <View style={styles.sort}>
        <Text style={styles.H2}>{title}</Text>
        <Pressable onPress={onToggleSort} style={styles.sortButton}>
          {orderAsc ? (
            <ActionButtonItem name="caret-up-outline" style={styles.actionButtonIcon} />
          ) : (
            <ActionButtonItem name="caret-down-outline" style={styles.actionButtonIcon} />
          )}
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderContentItem}
        contentContainerStyle={styles.flatlistContainer}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: width * 0.03,
    paddingTop: height * 0.02,
    borderBottomColor: '#444',
    borderBottomWidth: 0,
  },
  H2: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: RFValue(18, height),
  },
  sort: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  sortButton: {
    paddingHorizontal: 5,
    paddingTop: 2,
  },
  actionButtonIcon: {
    fontSize: 20,
    height: 22,
    color: 'white',
  },
  flatlistContainer: {
    paddingTop: height * 0.01,
    paddingBottom: height * 0.025,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ContentSection;