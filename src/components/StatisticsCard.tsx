import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@utils/currency';

const C = {
  white: '#fff',
  textDark: '#333',
  textMedium: '#666',
  textLight: '#999',
  shadow: '#000',
  background: '#F5F5F5',
  expense: '#F44336',
  income: '#4CAF50',
  border: '#E0E0E0',
};

interface StatisticsCardProps {
  netChange: number;
  expense: number;
  income: number;
  onInfoPress?: () => void;
}

export default function StatisticsCard({ netChange, expense, income, onInfoPress }: StatisticsCardProps): React.ReactElement {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Net Change</Text>
        {onInfoPress && (
          <TouchableOpacity onPress={onInfoPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="information-circle-outline" size={20} color={C.textLight} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.amount}>{formatCurrency(netChange)}</Text>

      <View style={styles.row}>
        <View style={[styles.childCard, styles.childCardBorder]}>
          <View style={styles.childRow}>
            <Ionicons name="caret-down" size={16} color={C.expense} />
            <Text style={styles.childAmount}>{formatCurrency(expense)}</Text>
          </View>
          <Text style={styles.childLabel}>Expense</Text>
        </View>
        <View style={styles.childCard}>
          <View style={styles.childRow}>
            <Ionicons name="caret-up" size={16} color={C.income} />
            <Text style={styles.childAmount}>{formatCurrency(income)}</Text>
          </View>
          <Text style={styles.childLabel}>Income</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: {
    color: C.textDark,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  childAmount: {
    color: C.textDark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  childCard: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  childCardBorder: {
    borderRightColor: C.border,
    borderRightWidth: 0.5,
  },
  childLabel: {
    color: C.textLight,
    fontSize: 12,
    marginLeft: 20,
  },
  childRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 2,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  row: {
    backgroundColor: C.background,
    borderRadius: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  title: {
    color: C.textMedium,
    fontSize: 14,
    fontWeight: '500',
  },
});
