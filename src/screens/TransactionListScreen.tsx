import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTransactionStore } from '@store/index';
import { useAuthStore } from '@store/index';
import { formatCurrency, formatDate } from '@utils/currency';

const styles = StyleSheet.create({
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  category: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  date: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  description: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  expense: {
    color: '#f44336',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  income: {
    color: '#4CAF50',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 15,
  },
});

export default function TransactionListScreen(): React.ReactElement {
  const { user } = useAuthStore();
  const { transactions, loadTransactions } = useTransactionStore();

  useEffect(() => {
    if (user) {
      loadTransactions({ userId: user.id });
    }
  }, [user, loadTransactions]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      {transactions.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>No transactions yet</Text>
        </View>
      ) : (
        transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.category}>{transaction.category}</Text>
              <Text style={styles.description}>{transaction.description}</Text>
              <Text style={styles.date}>{formatDate(transaction.date)}</Text>
            </View>
            <Text style={[styles.amount, transaction.type === 'income' ? styles.income : styles.expense]}>
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
