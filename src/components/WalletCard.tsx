import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@utils/currency';

const C = {
  primary: '#00BFA5',
  primaryLight: '#E0F2F1',
  white: '#fff',
  textDark: '#333',
  textMedium: '#666',
  shadow: '#000',
};

interface WalletCardProps {
  name: string;
  balance: number;
  onEdit?: () => void;
  onPress?: () => void;
}

export default function WalletCard({ name, balance, onEdit, onPress }: WalletCardProps): React.ReactElement {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet-outline" size={20} color={C.primary} />
        </View>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="create-outline" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <Text style={styles.balance}>{formatCurrency(balance)}</Text>
    </TouchableOpacity>
  );
}

const P = 16;
const styles = StyleSheet.create({
  balance: {
    color: C.textDark,
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    elevation: 3,
    marginRight: 12,
    padding: P,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    width: 180,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: C.primaryLight,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  name: {
    color: C.textMedium,
    fontSize: 14,
    marginBottom: 4,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: P,
  },
});
