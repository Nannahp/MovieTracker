// components/Header.js
import React from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Dimensions, Animated } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

const Header = ({ userEmail, showMenu, fadeAnim, onToggleMenu, onLogout }) => {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.H1}>MovieTracker</Text>
        <TouchableOpacity onPress={onToggleMenu} style={styles.profileIcon}>
          <Text style={styles.profileText}>☰</Text>
        </TouchableOpacity>
      </View>

      {showMenu && (
        <Animated.View style={[styles.dropdownMenu, { opacity: fadeAnim }]}>
          <Text style={styles.dropdownText}>Logged in as:</Text>
          <Text style={styles.dropdownText}>
            {userEmail.split('@')[0]}
          </Text>
          <Pressable onPress={onLogout} style={styles.logoutContainer}>
            <Icon name="sign-out" size={24} color="white" />
          </Pressable>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: height * 0.06,
    paddingBottom: height * 0.015,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  H1: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(28, height),
    textAlign: 'center',
  },
  profileIcon: {
    position: 'absolute',
    right: width * 0.05,
    top: height * 0.075,
    zIndex: 10,
  },
  profileText: {
    fontSize: RFValue(22, height),
    color: 'white',
  },
  dropdownMenu: {
    position: 'absolute',
    top: height * 0.12,
    right: width * 0.05,
    backgroundColor: '#222',
    padding: width * 0.04,
    borderRadius: width * 0.03,
    zIndex: 100000,
    width: width * 0.4,
    alignItems: 'center',
  },
  dropdownText: {
    color: 'white',
    marginBottom: height * 0.01,
    width: '100%',
    textAlign: 'center',
  },
  logoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
});

export default Header;