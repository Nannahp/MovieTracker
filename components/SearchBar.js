// SearchBar.js
import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Animated } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';

const { width, height } = Dimensions.get('window');

const SearchBar = ({ searchText, onChangeSearchText, onClose, fadeAnim }) => {
  return (
    <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
      <View style={styles.searchContainer}>
        <View style={styles.inputField}>
          <View style={styles.closeContainer}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>x</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            onChangeText={onChangeSearchText}
            value={searchText}
            placeholder="Search your movies and shows..."
            placeholderTextColor="#999"
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    backgroundColor: 'black',
    zIndex: 1000,
    paddingHorizontal: width * 0.09,
    height: height * 0.08,
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
});

export default SearchBar;