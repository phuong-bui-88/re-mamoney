import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  primary: '#00BFA5',
  primaryLight: '#E0F2F1',
  white: '#fff',
  border: '#E0E0E0',
  shadow: '#000',
};

interface NewWalletCardProps {
  onPress?: () => void;
}

export default function NewWalletCard({ onPress }: NewWalletCardProps): React.ReactElement {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Ionicons name="add" size={32} color={C.primary} />
      </View>
      <Text style={styles.label}>New Wallet</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: C.white,
    borderColor: C.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    elevation: 3,
    justifyContent: 'center',
    marginRight: 12,
    padding: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    width: 180,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: C.primaryLight,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: 8,
    width: 48,
  },
  label: {
    color: C.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
