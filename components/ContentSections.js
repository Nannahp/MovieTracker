// components/ContentSections.js
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ContentSection from './ContentSection';

const { width } = Dimensions.get('window');

const ContentSections = ({
  movies,
  series,
  movieOrderAsc,
  seriesOrderAsc,
  checkedItems,
  onToggleSort,
  onRemoveShow
}) => {
  return (
    <View style={styles.splitContainer}>
      <ContentSection
        title="Movies"
        data={movies}
        orderAsc={movieOrderAsc}
        checkedItems={checkedItems}
        collectionName="movies"
        onToggleSort={() => onToggleSort(movies, 'movies')}
        onRemoveShow={onRemoveShow}
      />
      
      <ContentSection
        title="TV"
        data={series}
        orderAsc={seriesOrderAsc}
        checkedItems={checkedItems}
        collectionName="tvShows"
        onToggleSort={() => onToggleSort(series, 'series')}
        onRemoveShow={onRemoveShow}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  splitContainer: {
    flex: 1,
    flexDirection: 'column',
  },
});

export default ContentSections;