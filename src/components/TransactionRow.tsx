import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import type { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@utils/currency';

const C = {
  white: '#fff',
  textDark: '#333',
  textLight: '#999',
  green: '#4CAF50',
  red: '#f44336',
  deleteRed: '#D32F2F',
  shadow: '#000',
};

interface TransactionRowProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export default function TransactionRow({ transaction, onDelete }: TransactionRowProps): React.ReactElement {
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const opacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View style={[styles.deleteBackground, { opacity }]} />
    );
  };

  const row = (
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

  if (onDelete) {
    return (
      <Swipeable
        renderRightActions={renderRightActions}
        onSwipeableRightOpen={() => onDelete(transaction.id)}
      >
        {row}
      </Swipeable>
    );
  }

  return row;
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
  deleteBackground: {
    backgroundColor: C.deleteRed,
    borderRadius: 8,
    flex: 1,
    marginVertical: 4,
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
