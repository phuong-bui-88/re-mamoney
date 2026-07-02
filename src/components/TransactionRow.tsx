import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import type { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@utils/currency';
import { CATEGORY_ICONS, CATEGORY_COLORS, FALLBACK_COLORS } from '@utils/categories';

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

  const catIcon = CATEGORY_ICONS[transaction.category] || 'ellipsis-horizontal-outline';
  let catColor = CATEGORY_COLORS[transaction.category];
  if (!catColor) {
    const keys = Object.keys(CATEGORY_COLORS);
    const idx = keys.indexOf(transaction.category);
    catColor = idx >= 0 ? CATEGORY_COLORS[transaction.category] : FALLBACK_COLORS[0];
  }

  const row = (
    <View style={styles.container}>
      <View style={[styles.iconBg, { backgroundColor: catColor }]}>
        <Ionicons name={catIcon as any} size={16} color="#fff" />
      </View>
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
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 8,
    flexDirection: 'row',
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
  iconBg: {
    alignItems: 'center',
    borderRadius: 20,
    height: 32,
    justifyContent: 'center',
    marginRight: 12,
    width: 32,
  },
  income: {
    color: C.green,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
});
