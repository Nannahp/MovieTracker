// components/SearchOverlay.js

import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, Dimensions, Linking } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { SvgUri } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const SearchOverlay = ({ text, onChangeText, entries, onClose, onAddItem }) => {
  const renderSearchItem = ({ item }) => (
    <TouchableOpacity onPress={() => onAddItem(item)} style={styles.movieItem}>
      <View style={styles.searchImageContainer}>
        <Image
          source={{
            uri: item.imageSet?.verticalPoster?.w360 || 'https://via.placeholder.com/150',
          }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.searchTitle}>{item.title}</Text>
      <View style={styles.gridContainer}>
        {item.streamingOptions?.dk ? (
          Array.from(
            new Map(
              item.streamingOptions.dk.map((platform) => [
                platform.service.id,
                platform,
              ])
            ).values()
          )
            .slice(0, 6)
            .map((platform, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => Linking.openURL(platform.link)}
                style={styles.logoButton}
              >
                <SvgUri
                  width="50"
                  height="50"
                  uri={platform.service.imageSet.darkThemeImage}
                />
              </TouchableOpacity>
            ))
        ) : (
          <Text style={styles.platform}>No streaming info</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.searchOverlay}>
      <View style={styles.inputField}>
        <View style={styles.closeContainer}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>x</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          onChangeText={onChangeText}
          value={text}
          placeholder="Search for movies and TV shows..."
          placeholderTextColor="#999"
        />
      </View>
      <FlatList
        horizontal
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderSearchItem}
        contentContainerStyle={styles.flatlistContainer}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 1000,
    paddingHorizontal: width * 0.06,
    paddingTop: height * 0.025,
  },
  inputField: {
    marginBottom: 0,
  },
  input: {
    height: height * 0.05,
    borderWidth: 1,
    borderColor: 'white',
    backgroundColor: 'white',
    paddingHorizontal: width * 0.03,
    borderRadius: width * 0.02,
  },
  closeContainer: {
    alignItems: 'flex-end',
    marginBottom: height * 0.01,
  },
  close: {
    color: 'white',
    fontSize: RFValue(22, height),
  },
  movieItem: {
    marginVertical: height * 0.015,
    marginHorizontal: width * 0.025,
    backgroundColor: '#1e1e1e',
    padding: width * 0.03,
    borderRadius: width * 0.035,
    width: width * 0.6,
    height: height * 0.5,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.025,
  },
  searchTitle: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: RFValue(18, height),
    borderBottomColor: '#444',
    borderBottomWidth: 1,
    height: height * 0.06,
  },
  searchImageContainer: {
    position: 'relative',
    width: '100%',
    height: '60%',
    marginBottom: height * 0.015,
    padding: width * 0.015,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    maxWidth: width * 0.9,
    gap: width * 0.02,
  },
  logoButton: {
    width: width * 0.15,
    height: height * 0.03,
    margin: width * 0.015,
  },
  platform: {
    color: 'white',
    fontSize: RFValue(12, height),
  },
  flatlistContainer: {
    paddingTop: height * 0.01,
    paddingBottom: height * 0.025,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchOverlay;