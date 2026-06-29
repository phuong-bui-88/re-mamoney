import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@utils/currency';

const C = {
  white: '#fff',
  textDark: '#333',
  textLight: '#999',
  green: '#4CAF50',
  red: '#f44336',
  shadow: '#000',
};

interface TransactionRowProps {
  transaction: Transaction;
}

export default function TransactionRow({ transaction }: TransactionRowProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.category}>{transaction.category}</Text>
        <Text style={styles.description}>{transaction.description}</Text>
        <Text style={styles.date}>{formatDate(transaction.date)}</Text>
      </View>
      <Text style={[styles.amount, transaction.type === 'expense' ? styles.expense : styles.income]}>
        {transaction.type === 'expense' ? '-' : '+'}
        {formatCurrency(transaction.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  category: {
    color: C.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    backgroundColor: C.white,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 15,
  },
  date: {
    color: C.textLight,
    fontSize: 12,
    marginTop: 4,
  },
  description: {
    color: C.textLight,
    fontSize: 12,
    marginTop: 4,
  },
  expense: {
    color: C.red,
  },
  income: {
    color: C.green,
  },
  info: {
    flex: 1,
  },
});
