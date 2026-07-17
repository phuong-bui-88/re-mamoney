import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTransactionStore } from '@store/index';
import type { Transaction } from '@/types';
import TransactionRow from './TransactionRow';

const C = {
  textLight: '#999',
};

interface FilteredTransactionListProps {
  category?: string;
  filterMode: 'month' | 'today';
  onTransactionPress?: (transaction: Transaction) => void;
}

export default function FilteredTransactionList({ category, filterMode, onTransactionPress }: FilteredTransactionListProps): React.ReactElement {
  const { transactions } = useTransactionStore();

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (category) {
      result = result.filter((t) => t.category === category);
    }

    if (filterMode === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter((t) => t.date >= today && t.date <= endOfDay);
    }

    return result;
  }, [transactions, category, filterMode]);

  const handleDelete = (id: string) => {
    useTransactionStore.getState().deleteTransaction(id);
  };

  if (filtered.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No transactions yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {filtered.map((transaction) => (
        <TransactionRow
          key={transaction.id}
          transaction={transaction}
          onDelete={handleDelete}
          onPress={onTransactionPress}
        />
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
