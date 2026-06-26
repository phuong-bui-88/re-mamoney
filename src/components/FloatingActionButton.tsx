import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  fab: '#00BCD4',
  white: '#fff',
};

interface FloatingActionButtonProps {
  onPress?: () => void;
}

export default function FloatingActionButton({ onPress }: FloatingActionButtonProps): React.ReactElement {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name="add" size={28} color={C.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    backgroundColor: C.fab,
    borderRadius: 28,
    bottom: 24,
    elevation: 6,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: C.fab,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: 56,
  },
});
