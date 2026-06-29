import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTransactionStore } from '@store/index';
import TransactionRow from './TransactionRow';

const C = {
  textLight: '#999',
};

interface FilteredTransactionListProps {
  type: 'income' | 'expense';
}

export default function FilteredTransactionList({ type }: FilteredTransactionListProps): React.ReactElement {
  const { transactions } = useTransactionStore();
  const filtered = transactions.filter((t) => t.type === type);

  if (filtered.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No {type} transactions yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {filtered.map((transaction) => (
        <TransactionRow key={transaction.id} transaction={transaction} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  empty: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: C.textLight,
    fontSize: 14,
  },
});
