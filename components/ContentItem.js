// components/ContentItem.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Linking } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { SvgUri } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const ContentItem = ({ item, checkedItems, collectionName, onRemoveShow }) => {
  const renderStreamingPlatforms = () => {
    if (!item.streamingOptions) {
      return <Text style={styles.platform}>No streaming info</Text>;
    }

    return Array.from(
      new Map(
        item.streamingOptions.map((platform) => [
          platform.service.id,
          platform,
        ])
      ).values()
    ).map((platform, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => Linking.openURL(platform.link)}
        style={styles.contentLogoButton}
      >
        <SvgUri
          width="30"
          height="30"
          uri={platform.service.imageSet.darkThemeImage}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.contentItem}>
      <View style={styles.contentImageContainer}>
        <BouncyCheckbox
          style={styles.checkbox}
          size={30}
          fillColor="white"
          unFillColor="#FFFFFF"
          iconStyle={{ borderColor: "red" }}
          innerIconStyle={{ borderWidth: 2 }}
          onPress={() => onRemoveShow(collectionName, item.id)}
          isChecked={!!checkedItems[item.id]}
        />
        <Image 
          source={{ uri: item.image }} 
          style={styles.image} 
          resizeMode="cover" 
        />
      </View>
      
      <Text style={styles.contentTitle}>{item.title}</Text>
      
      <View style={styles.contentGridContainer}>
        {renderStreamingPlatforms()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contentItem: {
    marginVertical: height * 0.015,
    marginHorizontal: width * 0.02,
    backgroundColor: '#1e1e1e',
    padding: width * 0.02,
    borderRadius: width * 0.03,
    width: width * 0.4,
    height: height * 0.33,
    position: 'relative',
  },
  contentImageContainer: {
    position: 'relative',
    width: '90%',
    height: '60%',
    left: '5%',
    marginBottom: height * 0.015,
  },
  checkbox: {
    position: 'absolute',
    left: width * 0.25,
    top: -height * 0.005,
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.025,
  },
  contentTitle: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: RFValue(10, height),
    height: height * 0.04,
  },
  contentGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    maxWidth: width * 0.5,
    gap: width * 0.02,
  },
  contentLogoButton: {
    width: width * 0.1,
    height: height * 0.015,
  },
  platform: {
    color: 'white',
    fontSize: RFValue(12, height),
  },
});

export default ContentItem;