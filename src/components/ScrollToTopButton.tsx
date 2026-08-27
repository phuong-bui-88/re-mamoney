import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  fab: '#00BFA5',
  white: '#fff',
};

interface ScrollToTopButtonProps {
  onPress?: () => void;
}

export default function ScrollToTopButton({ onPress }: ScrollToTopButtonProps): React.ReactElement {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name="chevron-up" size={24} color={C.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: C.fab,
    borderRadius: 22,
    bottom: 134,
    elevation: 6,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: C.fab,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: 44,
  },
});
