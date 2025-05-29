// AddedMessage.js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';

const { width, height } = Dimensions.get('window');

const AddedMessage = ({ message }) => {
  return (
    <View style={styles.addedMessage}>
      <Text style={styles.addedText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  addedMessage: {
    position: 'absolute',
    bottom: height * 0.1,
    padding: width * 0.03,
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.3,
    borderRadius: width * 0.02,
    zIndex: 10000,
    alignSelf: 'center',
  },
  addedText: {
    color: 'white',
    fontSize: RFValue(16, height),
    zIndex: 100,
  },
});

export default AddedMessage;