// FloatingActionMenu.js
import React from 'react';
import { StyleSheet } from 'react-native';
import ActionButton from 'react-native-circular-action-menu';
import ActionButtonItem from 'react-native-vector-icons/Ionicons';

const FloatingActionMenu = ({ onOpenAdd, onToggleSearch }) => {
  return (
    <ActionButton buttonColor="rgba(231,76,60,1)" style={styles.addButton}>
      <ActionButton.Item title="New Task">
        <ActionButtonItem name="" style={styles.actionButtonIcon} />
      </ActionButton.Item>
      <ActionButton.Item 
        buttonColor='rgba(231,76,60,1)' 
        title="Add Content" 
        onPress={onOpenAdd}
      >
        <ActionButtonItem name="add-outline" style={styles.actionButtonIcon} />
      </ActionButton.Item>
      <ActionButton.Item 
        buttonColor='rgba(231,76,60,1)' 
        title="Search" 
        onPress={onToggleSearch}
      >
        <ActionButtonItem name="search-outline" style={styles.actionButtonIcon} />
      </ActionButton.Item>
      <ActionButton.Item>
        <ActionButtonItem name="" style={styles.actionButtonIcon} />
      </ActionButton.Item>
    </ActionButton>
  );
};

const styles = StyleSheet.create({
  actionButtonIcon: {
    fontSize: 20,
    height: 22,
    color: 'white',
  },
  addButton: {
    // Add any specific styling for the action button if needed
  },
});

export default FloatingActionMenu;